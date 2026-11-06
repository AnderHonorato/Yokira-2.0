import { sql } from 'drizzle-orm';
import { loteAtomico, type Db, type Usuario } from './permissoes';
import { ativoSocial } from './social-base';
import { ErroApi } from './validacao';
import { cabecalhosImagem, lerImagem, validarBytesImagem } from './imagens-comunidade-validacao';
import { padraoIdImagem, podeLerImagem, urlImagemComunidade } from './imagens-comunidade-acesso';
export { idImagemComunidade, imagemDoUsuario, validarImagemDoUsuario, urlImagemComunidade } from './imagens-comunidade-acesso';

const quota = (usuarioId: string, agora: number, tamanho = 1) => sql`(
 select count(*) from chat_imagens where usuario_id=${usuarioId} and criado_em>=${Math.floor(agora / 86400000) * 86400000})<20
 and (select coalesce(sum(tamanho),0) from chat_imagens where usuario_id=${usuarioId})<=${100 * 1024 * 1024 - tamanho}`;
async function exigirDisponivel(db: Db, usuario: Usuario, agora: number, tamanho = 1) {
 const [ativo] = await db.all(sql`select 1 where ${ativoSocial(usuario.id)}`);
 if (usuario.suspenso || !ativo) throw new ErroApi('Sua conta não está ativa.', 403);
 const [livre] = await db.all(sql`select 1 where ${quota(usuario.id, agora, tamanho)}`);
 if (!livre) throw new ErroApi('Limite de imagens atingido. São permitidos 20 envios por dia e 100 MiB por conta.', 429);
}
export async function enviarImagemComunidade(db: Db, usuario: Usuario, bucket: R2Bucket, request: Request) {
 const { finalidade, mime, esperado } = cabecalhosImagem(request), agora = Date.now();
 await exigirDisponivel(db, usuario, agora);
 const [limite] = await loteAtomico(db, [sql`insert into limites(usuario_id,janela,quantidade)
  select ${usuario.id},${`imagem:${Math.floor(agora / 60000)}`},1 where ${ativoSocial(usuario.id)}
  on conflict(usuario_id,janela) do update set quantidade=quantidade+1 where quantidade<5 returning quantidade`]);
 if (!limite.results.length) throw new ErroApi('Aguarde um minuto antes de enviar outra imagem.', 429);
 const bytes = await lerImagem(request, esperado); validarBytesImagem(bytes, mime);
 const id = crypto.randomUUID(), chave = `comunidade/${crypto.randomUUID()}`;
 try {
  await bucket.put(chave, bytes, { httpMetadata: { contentType: mime } });
  const [gravada] = await db.all<{ id: string }>(sql`insert into chat_imagens(id,usuario_id,chave,mime,tamanho,finalidade,criado_em)
   select ${id},${usuario.id},${chave},${mime},${bytes.byteLength},${finalidade},${Date.now()}
   where ${ativoSocial(usuario.id)} and ${quota(usuario.id, Date.now(), bytes.byteLength)} returning id`);
  if (!gravada) { await exigirDisponivel(db, usuario, Date.now(), bytes.byteLength); throw new ErroApi('Não foi possível concluir o envio. Tente novamente.', 409); }
  return { id, url: urlImagemComunidade(id), mime, tamanho: bytes.byteLength };
 } catch (erro) { await bucket.delete(chave).catch(() => {}); throw erro; }
}
export async function obterImagemComunidade(db: Db, bucket: R2Bucket, request: Request, id: string, usuario?: Usuario) {
 if (!padraoIdImagem.test(id)) throw new ErroApi('Imagem não encontrada.', 404);
 const [imagem] = await db.all<{ id: string; usuarioId: string; chave: string; mime: string; tamanho: number }>(sql`
  select id,usuario_id as usuarioId,chave,mime,tamanho from chat_imagens where id=${id}`);
 if (!imagem || !await podeLerImagem(db, imagem, usuario)) throw new ErroApi('Imagem não encontrada.', 404);
 const headers = { 'Content-Type': imagem.mime, 'Content-Length': String(imagem.tamanho),
  'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'" };
 if (request.method === 'HEAD') {
  if (!await bucket.head(imagem.chave)) throw new ErroApi('Imagem não encontrada.', 404);
  return new Response(null, { headers });
 }
 const objeto = await bucket.get(imagem.chave);
 if (!objeto) throw new ErroApi('Imagem não encontrada.', 404);
 return new Response(objeto.body, { headers });
}
