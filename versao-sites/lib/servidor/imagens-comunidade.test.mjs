import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';

const sqlite = new DatabaseSync(':memory:'); sqlite.exec('PRAGMA foreign_keys=ON');
const pasta = new URL('../../drizzle/', import.meta.url);
for (const arquivo of readdirSync(pasta).filter(a => a.endsWith('.sql')).sort()) sqlite.exec(readFileSync(new URL(arquivo, pasta), 'utf8'));
class Prepared {
 constructor(query, params = []) { this.query = query; this.params = params; }
 bind(...params) { return new Prepared(this.query, params); }
 async raw() { const stmt = sqlite.prepare(this.query); stmt.setReturnArrays(true); return stmt.all(...this.params); }
 async all() { return { success: true, results: sqlite.prepare(this.query).all(...this.params), meta: {} }; }
 async run() { const r = sqlite.prepare(this.query).run(...this.params); return { success: true, results: [], meta: { changes: Number(r.changes) } }; }
}
const arquivos = new Map(); let aoPersistir;
const bucket = {
 async put(chave, bytes) { arquivos.set(chave, new Uint8Array(bytes)); await aoPersistir?.(); return {}; },
 async delete(chave) { arquivos.delete(chave); }, async head(chave) { return arquivos.has(chave) ? {} : null; },
 async get(chave) { return arquivos.has(chave) ? { body: new Blob([arquivos.get(chave)]).stream() } : null; }
};
globalThis.__imagemEnv = { BUCKET: bucket, DB: { prepare(q) { return new Prepared(q); }, async batch(stmts) {
 sqlite.exec('BEGIN'); try { const r = []; for (const stmt of stmts) r.push(await stmt.all()); sqlite.exec('COMMIT'); return r; }
 catch (erro) { sqlite.exec('ROLLBACK'); throw erro; }
} } };
registerHooks({ resolve(specifier, context, next) {
 if (specifier === 'cloudflare:workers') return { url: 'data:text/javascript,export const env=globalThis.__imagemEnv', shortCircuit: true };
 try { return next(specifier, context); } catch (erro) {
  if (specifier.startsWith('.')) for (const fim of ['.ts', '/index.ts']) { const url = new URL(specifier + fim, context.parentURL); if (existsSync(url)) return next(url.href, context); } throw erro;
 }
} });
const { getDb } = await import('../../db/index.ts');
const { enviarImagemComunidade, obterImagemComunidade, validarImagemDoUsuario, idImagemComunidade } = await import('./imagens-comunidade.ts');
const { POST } = await import('../../app/api/comunidade/imagens/route.ts');
const { HEAD } = await import('../../app/api/comunidade/imagens/[id]/route.ts');
const { lerImagem, validarBytesImagem, LIMITE_IMAGEM } = await import('./imagens-comunidade-validacao.ts');
const db = getDb(), dono = { id: 'imagem-dono', papel: 'membro', suspenso: false }, amigo = { ...dono, id: 'imagem-amigo' }, moderador = { ...dono, id: 'imagem-mod', papel: 'moderador' };
for (const u of [dono, amigo, moderador]) sqlite.prepare('insert into usuarios(id,nome,papel,criado_em) values(?,?,?,1)').run(u.id, u.id, u.papel);
const png = new Uint8Array(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0e8AAAAASUVORK5CYII=', 'base64'));
function pedido(bytes = png, headers = {}) { return new Request('https://yokira.test/api/comunidade/imagens', { method: 'POST', headers: { origin: 'https://yokira.test', 'oai-authenticated-user-id': dono.id, 'content-type': 'image/png', 'x-finalidade': 'chat', ...headers }, body: bytes, duplex: 'half' }); }
const rejeita = (operacao, status) => assert.rejects(operacao, e => e.status === status);
const ler = (id, usuario) => obterImagemComunidade(db, bucket, new Request(`https://yokira.test/api/comunidade/imagens/${id}`), id, usuario);
const limparLimite = () => sqlite.exec("delete from limites where janela like 'imagem:%'");
let imagem, avatar, banner;
test('envio autenticado persiste somente imagem concluída e resposta não revela chave ou dono', async () => {
 const resposta = await POST(pedido()); assert.equal(resposta.status, 201); imagem = await resposta.json();
 assert.deepEqual(Object.keys(imagem).sort(), ['id', 'mime', 'tamanho', 'url']); assert.equal(idImagemComunidade(imagem.url), imagem.id);
 const linha = sqlite.prepare('select * from chat_imagens where id=?').get(imagem.id);
 assert.equal(linha.usuario_id, dono.id); assert.equal(linha.tamanho, png.length); assert.equal(linha.mime, 'image/png');
 assert.equal(linha.chave.includes(dono.id), false); assert.deepEqual(arquivos.get(linha.chave), png);
 await rejeita(() => ler(imagem.id), 404); assert.equal((await ler(imagem.id, dono)).status, 200); assert.equal((await ler(imagem.id, moderador)).status, 200);
 await rejeita(() => ler(imagem.id, amigo), 404);
});
test('CSRF, identidade, finalidade e conteúdo falso são rejeitados', async () => {
 for (const headers of [{ origin: 'https://malicioso.test' }, { origin: '' }, { 'sec-fetch-site': 'cross-site' }]) assert.equal((await POST(pedido(png, headers))).status, 403);
 const anonimo = pedido(); anonimo.headers.delete('oai-authenticated-user-id'); assert.equal((await POST(anonimo)).status, 401);
 assert.equal((await POST(pedido(png, { 'x-finalidade': 'qualquer' }))).status, 400);
 for (const texto of ['<html>conteudo</html>', '<svg xmlns="http://www.w3.org/2000/svg"></svg>', 'GIF89a', '\x89PNG\r\n\x1a\n']) {
  limparLimite(); assert.equal((await POST(pedido(new TextEncoder().encode(texto)))).status, 415);
 }
 limparLimite(); assert.equal((await POST(pedido(png, { 'content-type': 'image/jpeg' }))).status, 415);
 const grande = png.slice(); new DataView(grande.buffer).setUint32(16, 4097);
 assert.throws(() => validarBytesImagem(grande, 'image/png'), e => e.status === 413);
 await rejeita(() => lerImagem(pedido(png), png.length + 1), 400);
 await rejeita(() => lerImagem(pedido(png), png.length - 1), 413);
 let partes = 0; const fluxo = new ReadableStream({ pull(c) { partes++; c.enqueue(new Uint8Array(1024 * 1024)); } });
 await rejeita(() => lerImagem(pedido(fluxo)), 413); assert.ok(partes <= 7); assert.equal(LIMITE_IMAGEM, 4194304);
});
test('JPEG e WebP reais validam dimensões; truncamento e 16 megapixels excessivos são recusados', () => {
 const jpeg = new Uint8Array(Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAADAAIDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwCjRRRXzB96f//Z', 'base64'));
 assert.deepEqual(validarBytesImagem(jpeg, 'image/jpeg'), { largura: 2, altura: 3 });
 assert.throws(() => validarBytesImagem(jpeg.subarray(0, jpeg.length - 2), 'image/jpeg'), e => e.status === 415);
 const webp = new Uint8Array(Buffer.from('UklGRjoAAABXRUJQVlA4IC4AAADQAQCdASoCAAMAAUAmJaACdLoB+AADsAD+5fo/+bA1RZvoB/9lY+lY+lY/coAA', 'base64'));
 assert.deepEqual(validarBytesImagem(webp, 'image/webp'), { largura: 2, altura: 3 });
 assert.throws(() => validarBytesImagem(webp.subarray(0, webp.length - 2), 'image/webp'), e => e.status === 415);
 const grande = png.slice(), v = new DataView(grande.buffer); v.setUint32(16, 4096); v.setUint32(20, 4096);
 assert.throws(() => validarBytesImagem(grande, 'image/png'), e => e.status === 413);
});
test('propriedade e finalidade são verificadas no SQL, sem aceitar URL externa ou parâmetro extra', async () => {
 assert.equal(await validarImagemDoUsuario(db, dono, imagem.url, 'chat'), imagem.id);
 await rejeita(() => validarImagemDoUsuario(db, amigo, imagem.url, 'chat'), 403);
 await rejeita(() => validarImagemDoUsuario(db, dono, imagem.url, 'avatar'), 403);
 for (const url of [`https://yokira.test${imagem.url}`, `${imagem.url}?dono=${dono.id}`, '/api/midia/' + imagem.id]) assert.throws(() => idImagemComunidade(url));
});
test('autorização revogada e quota concorrente após R2 removem objeto sem registro incompleto', async () => {
 limparLimite(); const antes = arquivos.size;
 aoPersistir = () => sqlite.prepare('update usuarios set suspenso=1 where id=?').run(dono.id);
 await rejeita(() => enviarImagemComunidade(db, dono, bucket, pedido()), 403); assert.equal(arquivos.size, antes);
 aoPersistir = undefined; sqlite.prepare('update usuarios set suspenso=0 where id=?').run(dono.id);
 aoPersistir = () => { for (let n = 0; n < 20; n++) sqlite.prepare('insert into chat_imagens(id,usuario_id,chave,mime,tamanho,finalidade,criado_em) values(?,?,?,?,?,?,?)').run(`quota-${n}`, dono.id, `quota-${n}`, 'image/png', 1, 'chat', Date.now()); };
 await rejeita(() => enviarImagemComunidade(db, dono, bucket, pedido()), 429); assert.equal(arquivos.size, antes);
 aoPersistir = undefined; sqlite.exec("delete from chat_imagens where id like 'quota-%'");
});
test('erro de armazenamento remove objeto parcial e não cria linha pendente', async () => {
 limparLimite(); const antes = arquivos.size, gravar = bucket.put;
 bucket.put = async (chave, bytes) => { arquivos.set(chave, bytes); throw new Error('indisponivel'); };
 try { await assert.rejects(() => enviarImagemComunidade(db, dono, bucket, pedido()), /indisponivel/); } finally { bucket.put = gravar; }
 assert.equal(arquivos.size, antes); assert.equal(sqlite.prepare('select count(*) n from chat_imagens').get().n, 1);
});
test('limites de frequência, contagem diária e bytes são consultados antes de gravar', async () => {
 limparLimite(); for (let n = 0; n < 5; n++) assert.equal((await POST(pedido(new Uint8Array([0])))).status, 415);
 assert.equal((await POST(pedido())).status, 429); limparLimite();
 for (let n = 0; n < 25; n++) sqlite.prepare('insert into chat_imagens(id,usuario_id,chave,mime,tamanho,finalidade,criado_em) values(?,?,?,?,?,?,?)').run(`total-${n}`, dono.id, `total-${n}`, 'image/png', 4194304, 'chat', 1);
 assert.equal((await POST(pedido())).status, 429); sqlite.exec("delete from chat_imagens where id like 'total-%'");
});
test('chat visível libera imagem; ocultar ou suspender autor revoga imediatamente', async () => {
 sqlite.prepare('insert into chat_mensagens(id,autor_id,corpo,imagem_id,sala_id,oculto,criado_em) values(?,?,?,?,null,0,1)').run('foto', dono.id, '', imagem.id);
 const resposta = await ler(imagem.id); assert.equal(resposta.status, 200); assert.equal(resposta.headers.get('cache-control'), 'private, no-store'); assert.equal(resposta.headers.get('x-content-type-options'), 'nosniff'); assert.equal(resposta.headers.get('content-type'), 'image/png');
 sqlite.exec("update chat_mensagens set oculto=1 where id='foto'"); await rejeita(() => ler(imagem.id), 404);
 sqlite.exec("update chat_mensagens set oculto=0 where id='foto'"); sqlite.prepare('update usuarios set suspenso=1 where id=?').run(dono.id); await rejeita(() => ler(imagem.id), 404);
 sqlite.prepare('update usuarios set suspenso=0 where id=?').run(dono.id); sqlite.exec("update chat_mensagens set oculto=1 where id='foto'");
});
test('avatar público e banner privado respeitam referência atual e amizade aceita ativa', async () => {
 limparLimite(); avatar = await enviarImagemComunidade(db, dono, bucket, pedido(png, { 'x-finalidade': 'avatar' }));
 banner = await enviarImagemComunidade(db, dono, bucket, pedido(png, { 'x-finalidade': 'banner' }));
 sqlite.prepare('insert into perfis_sociais(usuario_id,handle,publico,avatar,banner,atualizado_em) values(?,?,0,?,?,1)').run(dono.id, 'imagem_dono', avatar.url, banner.url);
 sqlite.prepare("update perfis_sociais set visual=json_set(visual,'$.capa','pessoal') where usuario_id=?").run(dono.id);
 assert.equal((await ler(avatar.id)).status, 200); await rejeita(() => ler(banner.id), 404); await rejeita(() => ler(banner.id, amigo), 404);
 sqlite.prepare("insert into amizades(usuario_a,usuario_b,solicitante_id,estado,criado_em,atualizado_em) values(min(?,?),max(?,?),?,'aceita',1,1)").run(dono.id, amigo.id, dono.id, amigo.id, amigo.id);
 assert.equal((await ler(banner.id, amigo)).status, 200);
 sqlite.prepare('update usuarios set suspenso=1 where id=?').run(amigo.id); await rejeita(() => ler(banner.id, amigo), 404); sqlite.prepare('update usuarios set suspenso=0 where id=?').run(amigo.id);
 sqlite.prepare('insert into bloqueios_sociais(autor_id,alvo_id,criado_em) values(?,?,1)').run(dono.id, amigo.id); await rejeita(() => ler(banner.id, amigo), 404);
 sqlite.prepare('update perfis_sociais set publico=1 where usuario_id=?').run(dono.id); assert.equal((await ler(banner.id)).status, 200);
 const cabeca = await HEAD(new Request(`https://yokira.test${avatar.url}`, { method: 'HEAD' }), { params: Promise.resolve({ id: avatar.id }) });
 assert.equal(cabeca.status, 200); assert.equal(cabeca.body, null); assert.equal(cabeca.headers.get('content-length'), String(png.length));
 sqlite.prepare("update perfis_sociais set avatar='',banner='' where usuario_id=?").run(dono.id); await rejeita(() => ler(avatar.id), 404); await rejeita(() => ler(banner.id), 404);
 // Uma referência pública legítima mantém a imagem disponível mesmo com outra mensagem oculta.
 sqlite.prepare('insert into chat_mensagens(id,autor_id,corpo,imagem_id,sala_id,oculto,criado_em) values(?,?,?,?,null,0,1)').run('foto-publica', dono.id, '', imagem.id); assert.equal((await ler(imagem.id)).status, 200);
});
