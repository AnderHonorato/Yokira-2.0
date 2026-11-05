import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { drizzle } from 'drizzle-orm/d1';

const sqlite = new DatabaseSync(':memory:');
sqlite.exec('PRAGMA foreign_keys=ON');
const pasta = new URL('../../drizzle/', import.meta.url);
for (const arquivo of readdirSync(pasta).filter(a => a.endsWith('.sql') && a !== '0014_conquistas.sql').sort()) sqlite.exec(readFileSync(new URL(arquivo, pasta), 'utf8'));
sqlite.exec("INSERT INTO usuarios(id,nome,criado_em) VALUES('legado','Legado',1); INSERT INTO notificacoes(id,usuario_id,evento,tipo,titulo,descricao,destino,criado_em,lida_em,celebrada_em) VALUES('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa','legado','primeiro-jogo','conquista','Título histórico','Descrição histórica','/?p=jogos&modo=quiz',5,6,7)");
sqlite.exec(readFileSync(new URL('0014_conquistas.sql', pasta), 'utf8'));
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
const { listarConquistas, equiparConquistas, listarDestaquesConquistas } = await import('./conquistas.ts');
const db = drizzle(cliente);
function pessoa(id, xp = 0) {
 sqlite.prepare('INSERT INTO usuarios(id,nome,xp,criado_em) VALUES(?,?,?,1)').run(id, id, xp);
 return { id, nome: id, xp, papel: 'membro', suspenso: false, criadoEm: 1 };
}

test('20 feitos têm progresso real, metas distintas e SQL idempotente por usuário e emblema', async () => {
 const usuario = pessoa('progresso'), outro = pessoa('sem-progresso');
 let painel = await listarConquistas(db, { ...usuario, xp: 99999 });
 assert.equal(painel.conquistas.length, 20);
 assert.deepEqual(painel.conquistas.filter(c => c.obtidaEm !== null).map(c => c.badgeId), ['boas-vindas']);
 assert.equal(painel.conquistas.find(c => c.badgeId === 'presenca-lendaria').progresso, 0);
 const gravar = sqlite.prepare('INSERT INTO lista(usuario_id,titulo_id,criado_em,situacao,nota) VALUES(?,?,1,?,?)');
 for (let i = 0; i < 12; i++) gravar.run(usuario.id, String(i), i < 3 ? 'concluido' : 'planejado', 8);
 painel = await listarConquistas(db, usuario);
 assert.equal(painel.conquistas.find(c => c.badgeId === 'colecionador').obtidaEm !== null, true);
 assert.equal(painel.conquistas.find(c => c.badgeId === 'critico').obtidaEm !== null, true);
 assert.equal(painel.conquistas.find(c => c.badgeId === 'tres-finais').obtidaEm !== null, true);
 assert.equal(painel.conquistas.find(c => c.badgeId === 'biblioteca-viva').progresso, 12);
 assert.equal(painel.conquistas.find(c => c.badgeId === 'biblioteca-viva').obtidaEm, null);
 const obtidas = painel.conquistas.filter(c => c.obtidaEm !== null);
 const primeira = await listarNotificacoes(db, usuario), repetida = await listarNotificacoes(db, usuario);
 assert.equal(primeira.length, obtidas.length);
 assert.deepEqual(primeira, repetida);
 assert.ok(primeira.every(c => c.badgeId && obtidas.some(o => o.badgeId === c.badgeId)));
 assert.equal((await listarConquistas(db, outro)).conquistas.filter(c => c.obtidaEm !== null).length, 1);
 sqlite.prepare('DELETE FROM lista WHERE usuario_id=?').run(usuario.id);
 assert.deepEqual((await listarConquistas(db, usuario)).conquistas.filter(c => c.obtidaEm !== null).map(c => c.badgeId), obtidas.map(c => c.badgeId));
 assert.throws(() => sqlite.prepare('INSERT INTO conquistas_usuario VALUES(?,?,1)').run(usuario.id, 'boas-vindas'), /UNIQUE/);
});
test('top três persistem na ordem e rejeitam não obtidas, duplicatas e outro usuário', async () => {
 const dono = pessoa('hall-dono'), outro = pessoa('hall-outro');
 sqlite.exec("INSERT INTO lista(usuario_id,titulo_id,criado_em) VALUES('hall-dono','hall-titulo',1); INSERT INTO jogos VALUES('hall-jogo','hall-dono','quiz','{}',1,1)");
 const ids = ['primeira-colecao', 'boas-vindas', 'primeiro-jogo'];
 await equiparConquistas(db, dono, { destaques: ids, usuarioId: outro.id });
 assert.deepEqual((await listarConquistas(db, dono)).destaques, ids);
 assert.deepEqual((await listarDestaquesConquistas(db, dono.id)).map(c => c.badgeId), ids);
 assert.deepEqual((await listarConquistas(db, outro)).destaques, []);
 for (const destaques of [['cem-finais'], ['boas-vindas','boas-vindas'], [...ids,'cem-finais'], ['inexistente'], [null], 'boas-vindas'])
  await assert.rejects(equiparConquistas(db, dono, { destaques }));
 await assert.rejects(equiparConquistas(db, outro, { destaques: ids, usuarioId: dono.id }));
 assert.deepEqual((await listarConquistas(db, dono)).destaques, ids);
 await equiparConquistas(db, dono, { destaques: [...ids].reverse() });
 assert.deepEqual((await listarConquistas(db, dono)).destaques, [...ids].reverse());
 assert.throws(() => sqlite.prepare('INSERT INTO conquistas_destaques VALUES(?,?,0)').run(outro.id, 'cem-finais'), /FOREIGN KEY/);
 sqlite.prepare('UPDATE usuarios SET suspenso=1 WHERE id=?').run(dono.id);
 await assert.rejects(equiparConquistas(db, dono, { destaques: [] }), /conta não pode editar/);
 assert.deepEqual((await listarConquistas(db, dono)).destaques, [...ids].reverse());
 sqlite.prepare('UPDATE usuarios SET suspenso=0 WHERE id=?').run(dono.id);
 await equiparConquistas(db, dono, { destaques: [] });
 assert.deepEqual(await listarDestaquesConquistas(db, dono.id), []);
});
test('feitos de jogos e amizade exigem resultado e aceitação persistidos', async () => {
 const usuario = pessoa('jogador'), amigo = pessoa('jogador-amigo');
 sqlite.prepare('INSERT INTO amizades VALUES(?,?,?,?,1,1)').run(usuario.id, amigo.id, usuario.id, 'pendente');
 const jogo = sqlite.prepare('INSERT INTO jogos VALUES(?,?,?, ?,1,1)');
 for (let i = 0; i < 10; i++) jogo.run(`vitoria-${i}`, usuario.id, 'adivinhe', JSON.stringify({ concluido: i < 5, ganhou: true }));
 let painel = await listarConquistas(db, usuario);
 assert.ok(painel.conquistas.find(c => c.badgeId === 'cinco-vitorias').obtidaEm !== null);
 assert.equal(painel.conquistas.find(c => c.badgeId === 'dez-desafios').progresso, 5);
 assert.equal(painel.conquistas.find(c => c.badgeId === 'primeiro-vinculo').obtidaEm, null);
 sqlite.prepare("UPDATE amizades SET estado='aceita' WHERE usuario_a=?").run(usuario.id);
 painel = await listarConquistas(db, usuario);
 assert.ok(painel.conquistas.find(c => c.badgeId === 'primeiro-vinculo').obtidaEm !== null);
 const [evento] = (await listarNotificacoes(db, usuario)).filter(c => c.badgeId === 'cinco-vitorias');
 assert.equal((await verNotificacoes(db, usuario, { ids:[evento.id], celebrar:true })).eventos.length, 1);
 assert.equal((await verNotificacoes(db, usuario, { ids:[evento.id], celebrar:true })).eventos.length, 0);
});
test('migração preserva texto, leitura, claim e propriedade dos eventos antigos', async () => {
 const usuario = { id:'legado' };
 const evento = (await listarNotificacoes(db, usuario)).find(c => c.badgeId === 'primeiro-jogo');
 assert.equal(evento.id, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
 assert.equal(evento.titulo, 'Título histórico'); assert.equal(evento.descricao, 'Descrição histórica');
 assert.equal(evento.lidaEm, 6); assert.equal(evento.celebradaEm, 7);
 assert.equal((await verNotificacoes(db, usuario, { ids:[evento.id], celebrar:true })).eventos.length, 0);
 assert.ok((await listarConquistas(db, usuario)).conquistas.find(c => c.badgeId === 'primeiro-jogo').obtidaEm !== null);
 assert.equal(sqlite.prepare('PRAGMA foreign_key_check').all().length, 0);
});
