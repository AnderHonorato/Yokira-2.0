import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';

const sqlite = new DatabaseSync(':memory:');
sqlite.exec('PRAGMA foreign_keys=ON');
const pasta = new URL('../../drizzle/', import.meta.url);
for (const file of readdirSync(pasta).filter(f => f.endsWith('.sql')).sort()) sqlite.exec(readFileSync(new URL(file, pasta), 'utf8'));
class Prepared {
    constructor(query, params = []) { this.query = query; this.params = params; }
    bind(...params) { return new Prepared(this.query, params); }
    async raw() { const stmt = sqlite.prepare(this.query); stmt.setReturnArrays(true); return stmt.all(...this.params); }
    async all() { return { success: true, results: sqlite.prepare(this.query).all(...this.params), meta: {} }; }
    async run() { const result = sqlite.prepare(this.query).run(...this.params); return { success: true, results: [], meta: { changes: Number(result.changes) } }; }
}
globalThis.__acervoEnv = { DB: { prepare(query) { return new Prepared(query); }, async batch(stmts) {
    sqlite.exec('BEGIN');
    try { const result = []; for (const stmt of stmts) result.push(await stmt.all()); sqlite.exec('COMMIT'); return result; }
    catch (error) { sqlite.exec('ROLLBACK'); throw error; }
} } };
registerHooks({ resolve(specifier, context, next) {
    if (specifier === 'cloudflare:workers') return { url: 'data:text/javascript,export const env=globalThis.__acervoEnv', shortCircuit: true };
    try { return next(specifier, context); }
    catch (error) { if (specifier.startsWith('.')) for (const suffix of ['.ts', '/index.ts']) { const url = new URL(specifier + suffix, context.parentURL); if (existsSync(url)) return next(url.href, context); } throw error; }
} });
const { getDb } = await import('../../db/index.ts');
const { obterAcervo, salvarAcervo } = await import('./catalogo-administrativo.ts');
const { validarAlteracaoAcervo } = await import('./validacao-acervo.ts');
const { catalogo, editoriais } = await import('../catalogo.ts');
const db = getDb();
sqlite.prepare("insert into usuarios(id,nome,papel,criado_em) values (?,?,?,?)").run('admin', 'Admin', 'administrador', Date.now());
sqlite.prepare("insert into usuarios(id,nome,papel,criado_em) values (?,?,?,?)").run('membro', 'Membro', 'membro', Date.now());
const admin = { id: 'admin', papel: 'administrador', suspenso: false };
function dados(item) { const { id, ...resto } = item; return resto; }
const payload = (extra = {}) => ({ tipo: 'titulo', alvoId: '1', dados: dados(catalogo[0]), oculto: false, motivo: 'Correção editorial verificada.', ...extra });
const falha = (status) => (error) => error.status === status;

test('acervo atualiza todos os metadados, mantém id e audita no mesmo lote', async () => {
    const editado = { ...dados(catalogo[0]), nome: 'Nome revisado', nota: 9.2, generos: ['Ação', 'Nova categoria'], video: '/midia/demonstracao-bbb.mp4' };
    const resultado = await salvarAcervo(db, admin, payload({ dados: editado }));
    assert.equal(resultado.id, '1');
    const salvo = (await obterAcervo(db)).catalogo.find(item => item.id === '1');
    assert.equal(salvo.nome, 'Nome revisado'); assert.equal(salvo.nota, 9.2); assert.deepEqual(salvo.generos, ['Ação', 'Nova categoria']);
    assert.equal(salvo.video, '/midia/demonstracao-bbb.mp4');
    assert.equal(sqlite.prepare("select count(*) as total from registros_moderacao where acao='salvar-acervo' and alvo_id='1'").get().total, 1);
});
test('disponibilidade de título respeita moderação e editoriais ocultos desaparecem do público', async () => {
    await salvarAcervo(db, admin, payload({ oculto: true }));
    assert.equal((await obterAcervo(db)).catalogo.some(item => item.id === '1'), false);
    assert.equal((await obterAcervo(db, true)).catalogo.find(item => item.id === '1').oculto, true);
    sqlite.prepare("update catalogo_disponibilidade set oculto=0 where titulo_id='1'").run();
    assert.equal((await obterAcervo(db)).catalogo.some(item => item.id === '1'), true);
    const editorial = editoriais[0];
    await salvarAcervo(db, admin, { tipo: 'editorial', alvoId: editorial.id, dados: { ...dados(editorial), titulo: 'Editorial revisado' }, oculto: true, motivo: 'Revisão temporária.' });
    assert.equal((await obterAcervo(db)).editoriais.some(item => item.id === editorial.id), false);
    const salvo = (await obterAcervo(db, true)).editoriais.find(item => item.id === editorial.id);
    assert.equal(salvo.titulo, 'Editorial revisado'); assert.equal(salvo.oculto, true);
});
test('novas séries e filmes recebem id do servidor e podem ser publicados e editados', async () => {
    for (const tipo of ['Série', 'Filme']) {
        const criacao = payload({ alvoId: undefined, dados: { ...dados(catalogo[0]), tipo, slug: tipo === 'Série' ? 'nova-serie' : 'novo-filme' }, oculto: true });
        const { id } = await salvarAcervo(db, admin, criacao);
        assert.match(id, /^[a-f0-9-]{36}$/); assert.equal((await obterAcervo(db)).catalogo.some(item => item.id === id), false);
        assert.equal((await obterAcervo(db, true)).catalogo.find(item => item.id === id).tipo, tipo);
        await salvarAcervo(db, admin, { ...criacao, alvoId: id, oculto: false });
        assert.equal((await obterAcervo(db)).catalogo.some(item => item.id === id), true);
    }
    await assert.rejects(salvarAcervo(db, admin, payload({ alvoId: undefined, dados: { ...dados(catalogo[0]), slug: 'nova-serie' } })), falha(409));
    await assert.rejects(salvarAcervo(db, admin, payload({ alvoId: 'nao-existe' })), falha(404));
});
test('validação rejeita campos internos, tipos incorretos, datas impossíveis e destinos inseguros', () => {
    for (const invalido of [{ id: 'outro' }, { oculto: true }, { ano: '2026' }, { episodios: 0.2 }, { duracao: 0 }, { nota: Infinity }, { nota: 9.99 }, { generos: ['Ação', 'ação'] }, { status: 'invisível' }, { slug: '../malicioso' }, { estreia: '2026-11-05' }])
        assert.throws(() => validarAlteracaoAcervo(payload({ dados: { ...dados(catalogo[0]), ...invalido } })), falha(400));
    for (const url of ['javascript:alert(1)', 'data:image/svg+xml,abc', '//externo.test/imagem', '/%2fexterno.test/imagem', '/\\externo.test/imagem', 'https://usuario:senha@externo.test/imagem'])
        assert.throws(() => validarAlteracaoAcervo(payload({ dados: { ...dados(catalogo[0]), poster: url } })), falha(400));
    for (const data of ['2026-02-31', '2026-13-01', '01/01/2026']) assert.throws(() => validarAlteracaoAcervo({ tipo: 'editorial', alvoId: editoriais[0].id, dados: { ...dados(editoriais[0]), data }, oculto: false, motivo: 'Correção.' }), falha(400));
    assert.throws(() => validarAlteracaoAcervo(payload({ oculto: 'false' })), falha(400));
    assert.throws(() => validarAlteracaoAcervo(payload({ motivo: 'x' })), falha(400));
});
test('permissão é revalidada no banco e uma auditoria que falha desfaz toda alteração', async () => {
    const antes = sqlite.prepare('select count(*) as total from registros_moderacao').get().total;
    await assert.rejects(salvarAcervo(db, { id: 'membro', papel: 'membro', suspenso: false }, payload()), falha(403));
    await assert.rejects(salvarAcervo(db, { id: 'membro', papel: 'administrador', suspenso: false }, payload()), falha(403));
    assert.equal(sqlite.prepare('select count(*) as total from registros_moderacao').get().total, antes);
    sqlite.exec("CREATE TRIGGER falha_auditoria BEFORE INSERT ON registros_moderacao WHEN NEW.motivo='FORCAR FALHA' BEGIN SELECT RAISE(ABORT,'teste de rollback'); END");
    const nomeAntes = (await obterAcervo(db, true)).catalogo.find(item => item.id === '1').nome;
    await assert.rejects(salvarAcervo(db, admin, payload({ dados: { ...dados(catalogo[0]), nome: 'Não deve persistir' }, oculto: true, motivo: 'FORCAR FALHA' })));
    assert.equal((await obterAcervo(db)).catalogo.find(item => item.id === '1').nome, nomeAntes);
    assert.equal(sqlite.prepare('select count(*) as total from registros_moderacao').get().total, antes);
    sqlite.exec('DROP TRIGGER falha_auditoria');
});
