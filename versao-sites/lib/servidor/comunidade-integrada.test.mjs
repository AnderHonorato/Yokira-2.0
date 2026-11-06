import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { sqlite, usuario, imagem, antesEscrita, limpar } from './chat-global-fixture.mjs';

const { GET, POST } = await import('../../app/api/yokira/route.ts');
const origem = 'https://yokira.test';
function leitura(acao, i = null, dados = {}) {
 const url = new URL('/api/yokira', origem); url.searchParams.set('acao', acao);
 for (const [chave, valor] of Object.entries(dados)) url.searchParams.set(chave, valor);
 return GET(new Request(url, { headers: i === null ? {} : { 'oai-authenticated-user-id': usuario(i).id } }));
}
function escrita(acao, i = 2, dados = {}, headers = {}) {
 return POST(new Request(`${origem}/api/yokira`, { method: 'POST', headers: {
  origin: origem, 'content-type': 'application/json', ...(i === null ? {} : { 'oai-authenticated-user-id': usuario(i).id }), ...headers
 }, body: JSON.stringify({ acao, ...dados }) }));
}
async function cartao(i, visitante = null) {
 const resposta = await leitura('cartao-perfil', visitante, { usuarioId: usuario(i).id });
 assert.equal(resposta.status, 200); return (await resposta.json()).perfil;
}
function perfil(i, valores) {
 if('banner' in valores&&!('visual' in valores))valores={...valores,visual:JSON.stringify({capa:valores.banner?'pessoal':'origem',moldura:'essencial',aura:'brisa'})};
 for (const [coluna, valor] of Object.entries(valores)) sqlite.prepare(`update perfis_sociais set ${coluna}=? where usuario_id=?`).run(valor, usuario(i).id);
}
beforeEach(() => {
 limpar(); sqlite.exec('delete from atividade_perfis;delete from amizades;delete from bloqueios_sociais');
 sqlite.exec("update usuarios set suspenso=0;update perfis_sociais set publico=0,compartilhar_atividade=0,avatar='',banner=''");
 sqlite.exec("update episodios set publicado=1,arquivado=0,estreia_em=null where id='chat-ep';update temporadas set arquivado=0 where id='chat-temp';delete from catalogo_disponibilidade where titulo_id='1'");
});

test('API pública permite ler e exige autenticação e origem válida para enviar', async () => {
 const resposta = await leitura('chat-global'); assert.equal(resposta.status, 200);
 assert.equal(resposta.headers.get('cache-control'), 'private, no-store'); assert.equal(resposta.headers.get('x-content-type-options'), 'nosniff');
 assert.deepEqual((await resposta.json()).mensagens, []);
 assert.equal((await escrita('chat-global-enviar', null, { corpo: 'Visitante' })).status, 401);
 assert.equal((await escrita('chat-global-enviar', 2, { corpo: 'Outro site' }, { origin: 'https://externo.test' })).status, 403);
 assert.equal((await escrita('chat-global-enviar', 2, { corpo: 'Outro site' }, { 'sec-fetch-site': 'cross-site' })).status, 403);
 const enviada = await escrita('chat-global-enviar', 2, { corpo: 'Uma conversa pública.' }); assert.equal(enviada.status, 200);
 const publico = await (await leitura('chat-global')).json(); assert.equal(publico.mensagens.length, 1);
 assert.equal(publico.mensagens[0].corpo, 'Uma conversa pública.'); assert.equal(publico.mensagens[0].autor.id, usuario(2).id);
 assert.equal(JSON.stringify(publico).includes('segredo.mp4'), false);
});
test('API associa apenas foto de finalidade chat pertencente à sessão', async () => {
 const propria = imagem(3), alheia = imagem(4), avatar = imagem(3, 'avatar');
 for (const foto of [alheia, avatar]) assert.equal((await escrita('chat-global-enviar', 3, { imagem: foto })).status, 403);
 assert.equal((await escrita('chat-global-enviar', 3, { imagem: propria, usuarioId: usuario(4).id })).status, 400);
 assert.equal((await escrita('chat-global-enviar', 3, { imagem: propria })).status, 200);
 const publico = await (await leitura('chat-global')).json(); assert.equal(publico.mensagens.length, 1);
 assert.equal(publico.mensagens[0].imagem, propria); assert.equal(publico.mensagens[0].autor.id, usuario(3).id);
 const linha = sqlite.prepare('select autor_id,imagem_id from chat_mensagens').get();
 assert.equal(linha.autor_id, usuario(3).id); assert.equal(linha.imagem_id, propria.split('/').at(-1));
});
test('cartão de perfil privado mostra identidade pública e preserva capa e informações pessoais', async () => {
 const avatar = imagem(5, 'avatar'), banner = imagem(5, 'banner'); perfil(5, { avatar, banner });
 const privado = await cartao(5); assert.equal(privado.acessivel, false); assert.equal(privado.avatar, avatar);
 assert.equal(privado.banner, ''); assert.equal(privado.atividade, null); assert.deepEqual(privado.conquistas, []);
 for (const campo of ['email', 'bio', 'xp', 'criadoEm', 'papel', 'compartilharAtividade']) assert.equal(campo in privado, false);
 assert.equal((await leitura('perfil-publico', null, { handle: 'chat_pessoa_5' })).status, 404);
 const proprio = await cartao(5, 5); assert.equal(proprio.acessivel, true); assert.equal(proprio.banner, banner);
 perfil(5, { publico: 1 }); const aberto = await cartao(5); assert.equal(aberto.acessivel, true); assert.equal(aberto.banner, banner);
});
test('autor de perfil privado pode receber amizade pelo chat público e liberar cartão após aceitar', async () => {
 const banner = imagem(6, 'banner'); perfil(6, { banner });
 assert.equal((await escrita('amizade', 7, { operacao: 'solicitar', alvoId: usuario(6).id })).status, 409);
 assert.equal((await escrita('chat-global-enviar', 6, { corpo: 'Podemos conversar por aqui.' })).status, 200);
 assert.equal((await cartao(6, 7)).acessivel, false);
 assert.equal((await escrita('amizade', 7, { operacao: 'solicitar', alvoId: usuario(6).id })).status, 200);
 assert.equal((await escrita('amizade', 6, { operacao: 'aceitar', alvoId: usuario(7).id })).status, 200);
 const amigo = await cartao(6, 7); assert.equal(amigo.relacao, 'amigo'); assert.equal(amigo.acessivel, true); assert.equal(amigo.banner, banner);
 assert.equal((await cartao(6)).acessivel, false);
 assert.equal((await escrita('amizade', 6, { operacao: 'bloquear', alvoId: usuario(7).id })).status, 200);
 assert.equal((await leitura('cartao-perfil', 7, { usuarioId: usuario(6).id })).status, 404);
});
test('atividade pertence somente à sessão e só fica pública após consentimento e perfil público', async () => {
 assert.equal((await escrita('atividade-video', 8, { episodioId: 'chat-ep', usuarioId: usuario(9).id })).status, 200);
 const linha = sqlite.prepare('select usuario_id,episodio_id from atividade_perfis').get(); assert.equal(linha.usuario_id, usuario(8).id); assert.equal(linha.episodio_id, 'chat-ep');
 assert.equal(sqlite.prepare('select count(*) n from atividade_perfis where usuario_id=?').get(usuario(9).id).n, 0);
 assert.equal((await cartao(8, 8)).atividade, null); perfil(8, { publico: 1 }); assert.equal((await cartao(8)).atividade, null);
 perfil(8, { compartilhar_atividade: 1 }); const ativo = await cartao(8);
 assert.equal(ativo.atividade.episodioId, 'chat-ep'); assert.equal(ativo.atividade.tituloId, '1'); assert.equal(ativo.atividade.episodio, 1);
 assert.equal(typeof ativo.atividade.titulo, 'string'); assert.ok(ativo.atividade.titulo.length);
 assert.deepEqual(Object.keys(ativo.atividade).sort(), ['atualizadoEm', 'episodio', 'episodioId', 'titulo', 'tituloId']);
 for (const segredo of ['segredo.mp4', 'video_url', 'videoUrl', 'Episódio reservado']) assert.equal(JSON.stringify(ativo).includes(segredo), false);
 perfil(8, { publico: 0 }); assert.equal((await cartao(8)).atividade, null); assert.equal((await cartao(8, 8)).atividade.episodioId, 'chat-ep');
 perfil(8, { compartilhar_atividade: 0 }); assert.equal((await cartao(8, 8)).atividade, null);
});
test('rascunho, estreia futura e ocultação revogam leitura e impedem nova atividade', async () => {
 perfil(10, { publico: 1, compartilhar_atividade: 1 }); assert.equal((await escrita('atividade-video', 10, { episodioId: 'chat-ep' })).status, 200);
 const alteracoes = [
  ["update episodios set publicado=0 where id='chat-ep'", "update episodios set publicado=1 where id='chat-ep'"],
  ["update episodios set estreia_em=9999999999999 where id='chat-ep'", "update episodios set estreia_em=null where id='chat-ep'"],
  ["update episodios set arquivado=1 where id='chat-ep'", "update episodios set arquivado=0 where id='chat-ep'"],
  ["update temporadas set arquivado=1 where id='chat-temp'", "update temporadas set arquivado=0 where id='chat-temp'"],
  ["insert into catalogo_disponibilidade(titulo_id,oculto) values('1',1)", "delete from catalogo_disponibilidade where titulo_id='1'"]
 ];
 for (const [revogar, restaurar] of alteracoes) {
  sqlite.exec(revogar);
  try { assert.equal((await cartao(10)).atividade, null); assert.equal((await escrita('atividade-video', 10, { episodioId: 'chat-ep' })).status, 404); }
  finally { sqlite.exec(restaurar); }
  assert.equal((await cartao(10)).atividade.episodioId, 'chat-ep');
 }
});
test('suspensão entre autenticação e escrita bloqueia atividade sem criar registro', async () => {
 antesEscrita(() => sqlite.prepare('update usuarios set suspenso=1 where id=?').run(usuario(11).id), 'atividade_perfis');
 try {
  assert.equal((await escrita('atividade-video', 11, { episodioId: 'chat-ep' })).status, 403);
  assert.equal(sqlite.prepare('select count(*) n from atividade_perfis where usuario_id=?').get(usuario(11).id).n, 0);
  assert.equal((await leitura('cartao-perfil', null, { usuarioId: usuario(11).id })).status, 404);
 } finally { sqlite.prepare('update usuarios set suspenso=0 where id=?').run(usuario(11).id); }
});
