import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';

const sqlite = new DatabaseSync(':memory:');
sqlite.exec('PRAGMA foreign_keys=ON');
const pasta = new URL('../../drizzle/', import.meta.url);
const ler = caminho => readFileSync(new URL(caminho, pasta), 'utf8');
for (const arquivo of readdirSync(pasta).filter(a => a.endsWith('.sql')).sort()) sqlite.exec(ler(arquivo));
class Prepared {
  constructor(query, params = []) { this.query = query; this.params = params; }
  bind(...params) { return new Prepared(this.query, params); }
  async raw() { const stmt = sqlite.prepare(this.query); stmt.setReturnArrays(true); return stmt.all(...this.params); }
  async all() { return { success: true, results: sqlite.prepare(this.query).all(...this.params), meta: {} }; }
}
globalThis.__aparenciaEnv = { DB: { prepare(query) { return new Prepared(query); }, async batch(stmts) {
  sqlite.exec('BEGIN');
  try { const result = []; for (const stmt of stmts) result.push(await stmt.all()); sqlite.exec('COMMIT'); return result; }
  catch (error) { sqlite.exec('ROLLBACK'); throw error; }
} } };
registerHooks({ resolve(specifier, context, next) {
  if (specifier === 'cloudflare:workers') return { url: 'data:text/javascript,export const env=globalThis.__aparenciaEnv', shortCircuit: true };
  try { return next(specifier, context); }
  catch (error) {
    if (specifier.startsWith('.')) for (const suffix of ['.ts', '/index.ts']) {
      const url = new URL(specifier + suffix, context.parentURL); if (existsSync(url)) return next(url.href, context);
    }
    throw error;
  }
} });
const { getDb } = await import('../../db/index.ts');
const { obterAparencia, salvarAparencia } = await import('./aparencia.ts');
const db = getDb();
for (const [id, papel, suspenso] of [['admin', 'administrador', 0], ['reserva', 'administrador', 0], ['moderador', 'moderador', 0], ['membro', 'membro', 0], ['suspenso', 'administrador', 1]])
  sqlite.prepare('insert into usuarios(id,nome,papel,suspenso,criado_em) values(?,?,?,?,?)').run(id, id, papel, suspenso, 1);
const admin = { id: 'admin', papel: 'administrador', suspenso: false };
const payload = { cenario: 8, intensidade: 'equilibrado', motivo: 'Nova identidade do site.' };
const falha = status => error => error.status === status;

test('leitura pública tem padrão persistido e todos leem a mesma aparência publicada', async () => {
  assert.deepEqual(await obterAparencia(db), { cenario: 0, intensidade: 'intenso', atualizadoEm: 0 });
  const salvo = await salvarAparencia(db, admin, payload);
  assert.equal(salvo.ok, true); assert.ok(salvo.aparencia.atualizadoEm > 0);
  assert.deepEqual(await obterAparencia(db), salvo.aparencia);
  const registro = sqlite.prepare("select * from registros_moderacao where acao='salvar-aparencia'").get();
  assert.equal(registro.autor_id, 'admin'); assert.equal(registro.motivo, payload.motivo); assert.equal(registro.alvo_id, 'global');
});

test('moderação, membro, identidade ausente e administrador rebaixado não publicam nem auditam', async () => {
  const antes = await obterAparencia(db);
  const total = sqlite.prepare('select count(*) total from registros_moderacao').get().total;
  for (const id of ['moderador', 'membro', 'suspenso', 'inexistente'])
    await assert.rejects(() => salvarAparencia(db, { ...admin, id }, payload), falha(403));
  await assert.rejects(() => salvarAparencia(db, { ...admin, papel: 'moderador' }, payload), falha(403));
  sqlite.prepare("update usuarios set papel='membro' where id='admin'").run();
  await assert.rejects(() => salvarAparencia(db, admin, payload), falha(403));
  sqlite.prepare("update usuarios set papel='administrador' where id='admin'").run();
  assert.deepEqual(await obterAparencia(db), antes);
  assert.equal(sqlite.prepare('select count(*) total from registros_moderacao').get().total, total);
});

test('entrada inválida é rejeitada sem coerção ou campos internos', async () => {
  for (const extra of [{ cenario: -1 }, { cenario: 10 }, { cenario: 1.5 }, { cenario: '1' }, { intensidade: 'automatica' }, { motivo: 'a' }, { motivo: 'x'.repeat(501) }, { atualizadoEm: 4 }, { usuarioId: 'admin' }])
    await assert.rejects(() => salvarAparencia(db, admin, { ...payload, ...extra }), falha(400));
});

test('confirmações usam revisão monotônica mesmo com relógio repetido ou atrasado', async () => {
  const original = Date.now;
  const antes = await obterAparencia(db);
  try {
    Date.now = () => antes.atualizadoEm;
    const primeira = (await salvarAparencia(db, admin, { ...payload, cenario: 1, motivo: 'Mesmo instante do relógio.' })).aparencia;
    assert.equal(primeira.atualizadoEm, antes.atualizadoEm + 1);
    Date.now = () => antes.atualizadoEm - 1000;
    const ultima = (await salvarAparencia(db, admin, { ...payload, cenario: 3, motivo: 'Relógio de outro servidor atrasado.' })).aparencia;
    assert.equal(ultima.atualizadoEm, primeira.atualizadoEm + 1);
    assert.equal(ultima.cenario, 3);
    assert.deepEqual(await obterAparencia(db), ultima);
    const registro = sqlite.prepare("select criado_em from registros_moderacao where acao='salvar-aparencia' and motivo=?").get('Relógio de outro servidor atrasado.');
    assert.equal(registro.criado_em, ultima.atualizadoEm);
  } finally {
    Date.now = original;
  }
});

test('falha na auditoria reverte a configuração no mesmo lote SQLite', async () => {
  const antes = await obterAparencia(db);
  sqlite.exec("CREATE TRIGGER falhar_aparencia BEFORE INSERT ON registros_moderacao WHEN NEW.acao='salvar-aparencia' BEGIN SELECT RAISE(ABORT,'auditoria indisponivel'); END");
  await assert.rejects(() => salvarAparencia(db, admin, { ...payload, cenario: 2 }));
  assert.deepEqual(await obterAparencia(db), antes);
  sqlite.exec('DROP TRIGGER falhar_aparencia');
});

test('migração incremental mantém dados antigos, singleton e restrições de configuração', () => {
  assert.equal(sqlite.prepare("select nome from usuarios where id='admin'").get().nome, 'admin');
  for (const comando of ["insert into aparencia_global values(2,0,'intenso',0)", "update aparencia_global set cenario=10", "update aparencia_global set intensidade='livre'", 'update aparencia_global set atualizado_em=-1'])
    assert.throws(() => sqlite.exec(comando), /CHECK/);
  const anterior = JSON.parse(ler('meta/0009_snapshot.json'));
  const atual = JSON.parse(ler('meta/0010_snapshot.json'));
  assert.equal(atual.prevId, anterior.id);
  for (const [nome, tabela] of Object.entries(anterior.tables)) assert.deepEqual(atual.tables[nome], tabela);
  assert.equal(Object.keys(atual.tables).length, Object.keys(anterior.tables).length + 1);
  assert.equal(atual.tables.aparencia_global.name, 'aparencia_global');
  const entradas = JSON.parse(ler('meta/_journal.json')).entries;
  assert.deepEqual(entradas.filter(e => e.idx <= 10).map(e => e.idx), Array.from({ length: 11 }, (_, i) => i));
  assert.equal(entradas[10].tag, '0010_aparencia_global');
  for (const entrada of entradas) assert.ok(existsSync(new URL(entrada.tag + '.sql', pasta)));
});
