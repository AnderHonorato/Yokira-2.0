import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { drizzle } from 'drizzle-orm/d1';

const sqlite = new DatabaseSync(':memory:');
sqlite.exec('PRAGMA foreign_keys=ON');
const pasta = new URL('../../drizzle/', import.meta.url);
for (const arquivo of readdirSync(pasta).filter(a => a.endsWith('.sql')).sort()) sqlite.exec(readFileSync(new URL(arquivo, pasta), 'utf8'));
class Preparado {
 constructor(query, params = []) { this.query = query; this.params = params; }
 bind(...params) { return new Preparado(this.query, params); }
 async all() { return { success: true, results: sqlite.prepare(this.query).all(...this.params), meta: {} }; }
}
const cliente = {
 prepare(query) { return new Preparado(query); },
 async batch(consultas) {
  sqlite.exec('BEGIN');
  try { const resultados = []; for (const consulta of consultas) resultados.push(await consulta.all()); sqlite.exec('COMMIT'); return resultados; }
  catch (erro) { sqlite.exec('ROLLBACK'); throw erro; }
 },
};
registerHooks({ resolve(specifier, context, next) {
 if (specifier === 'cloudflare:workers') return { url: 'data:text/javascript,export const env={}', shortCircuit: true };
 try { return next(specifier, context); } catch (erro) {
  if (specifier.startsWith('.')) for (const sufixo of ['.ts', '/index.ts']) { const url = new URL(specifier + sufixo, context.parentURL); if (existsSync(url)) return next(url.href, context); }
  throw erro;
 }
} });
const { listarNotificacoes, verNotificacoes } = await import('./notificacoes.ts');
const { origemNotificacao } = await import('../notificacoes.ts');
const db = drizzle(cliente);
function pessoa(id, xp = 0) {
 sqlite.prepare('INSERT INTO usuarios(id,nome,xp,criado_em) VALUES(?,?,?,1)').run(id, id, xp);
 return { id, nome: id, xp, papel: 'membro', suspenso: false, criadoEm: 1 };
}

test('conquistas usam fatos persistidos e geração repetida mantém um evento por pessoa', async () => {
 const a = pessoa('a', 250), b = pessoa('b');
 sqlite.prepare("INSERT INTO publicacoes(id,autor_id,tipo,titulo,corpo,criado_em) VALUES('post-a','a','forum','Privado','Não copiar',1)").run();
 sqlite.prepare("INSERT INTO jogos(id,usuario_id,modo,dados,criado_em,atualizado_em) VALUES('jogo-a','a','quiz','{}',1,1)").run();
 sqlite.prepare("INSERT INTO lista(usuario_id,titulo_id,criado_em) VALUES('a','1',1)").run();
 const primeira = await listarNotificacoes(db, a), repetida = await listarNotificacoes(db, a);
 assert.equal(primeira.length, 6); assert.deepEqual(new Set(primeira.map(n => n.id)), new Set(repetida.map(n => n.id)));
 assert.ok(primeira.some(n => n.titulo === 'Nível 3 alcançado'));
 assert.ok(primeira.some(n => n.destino === '/?p=forum&post=post-a'));
 assert.ok(primeira.some(n => n.destino === '/?p=jogos&modo=quiz'));
 assert.ok(primeira.some(n => n.destino === '/?p=listas&editar=1'));
 assert.ok(primeira.every(n => !JSON.stringify(n).includes('Não copiar')));
 assert.equal((await listarNotificacoes(db, b)).length, 1);
 // Um cliente não cria níveis enviando XP; somente o valor persistido é usado.
 assert.equal((await listarNotificacoes(db, { ...b, xp: 9999 })).length, 1);
 sqlite.prepare("UPDATE usuarios SET xp=400 WHERE id='a'").run();
 assert.equal((await listarNotificacoes(db, a)).length, 8);
});

test('reivindicação persiste e somente a primeira aba recebe cada celebração', async () => {
 const usuario = pessoa('duas-abas', 100);
 const lista = await listarNotificacoes(db, usuario), ids = lista.map(n => n.id);
 const primeira = await verNotificacoes(db, usuario, { ids, celebrar: true });
 const outraAba = await verNotificacoes(db, usuario, { ids, celebrar: true });
 assert.equal(primeira.eventos.length, 2); assert.equal(outraAba.eventos.length, 0);
 assert.ok(primeira.eventos.every(n => n.celebradaEm !== null && n.lidaEm === null));
 const visita = await listarNotificacoes(db, usuario);
 assert.equal(visita.filter(n => n.celebradaEm === null).length, 0);
 await verNotificacoes(db, usuario, { ids, ler: true });
 const lidas = await listarNotificacoes(db, usuario);
 assert.ok(lidas.every(n => n.lidaEm !== null));
 const datas = lidas.map(n => n.lidaEm);
 await verNotificacoes(db, usuario, { ids, ler: true });
 assert.deepEqual((await listarNotificacoes(db, usuario)).map(n => n.lidaEm), datas);
});

test('identidade injetada isola histórico e gravações mesmo com usuarioId adulterado', async () => {
 const dono = pessoa('dono'), outro = pessoa('outro');
 const [privada] = await listarNotificacoes(db, dono);
 await listarNotificacoes(db, outro);
 assert.deepEqual((await verNotificacoes(db, outro, { usuarioId: dono.id, ids: [privada.id], ler: true, celebrar: true })).eventos, []);
 assert.equal((await listarNotificacoes(db, dono))[0].lidaEm, null);
 assert.equal((await listarNotificacoes(db, dono))[0].celebradaEm, null);
 sqlite.prepare("UPDATE usuarios SET suspenso=1 WHERE id='dono'").run();
 assert.equal((await verNotificacoes(db, { ...dono, suspenso: true }, { ids: [privada.id], ler: true })).eventos.length, 1);
 assert.deepEqual((await verNotificacoes(db, dono, { ids: [], celebrar: true })).eventos, []);
 for (const dados of [{ ler: 'true' }, { celebrar: 1 }, { ids: ['invalido'], ler: true }, { ids: new Array(201).fill(privada.id), ler: true }, {}]) await assert.rejects(verNotificacoes(db, dono, dados));
});

test('conteúdo oculto não gera conquista e destinos maliciosos são bloqueados', async () => {
 const usuario = pessoa('oculto');
 sqlite.prepare("INSERT INTO publicacoes(id,autor_id,oculto,tipo,titulo,corpo,criado_em) VALUES('oculto-post','oculto',1,'forum','Segredo','Segredo',1)").run();
 assert.equal((await listarNotificacoes(db, usuario)).length, 1);
 const destinos = ['https://evil.test', '//evil.test', 'javascript:alert(1)', '/?p=forum&post=javascript%3Aalert(1)', '/?p=perfil&next=https://evil.test', '/?p=admin', '/?p=__proto__', '/?p=constructor', '/?p=jogos&modo=externo', '/?p=forum#javascript:alert(1)', '/?p=amizades&aba=admin'];
 assert.equal(origemNotificacao('/?p=amizades&aba=recebidas').caminho,'/?p=amizades&aba=recebidas');
 for (const destino of destinos) assert.equal(origemNotificacao(destino).caminho, '/?p=perfil');
 assert.equal(origemNotificacao('/?p=forum&post=post-a').caminho, '/?p=forum&post=post-a');
 assert.throws(() => sqlite.prepare("UPDATE notificacoes SET destino='javascript:alert(1)' WHERE usuario_id='oculto'").run(), /CHECK constraint/);
 assert.equal(sqlite.prepare('PRAGMA foreign_key_check').all().length, 0);
});
