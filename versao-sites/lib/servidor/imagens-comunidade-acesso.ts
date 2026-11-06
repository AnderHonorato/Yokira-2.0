import { sql, type SQL } from 'drizzle-orm';
import { equipeAtiva, type Db, type Usuario } from './permissoes';
import { ativoSocial, amizadeAceita, semBloqueio } from './social-base';
import { ErroApi } from './validacao';
import type { FinalidadeImagem } from './imagens-comunidade-validacao';

export const padraoIdImagem = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export const urlImagemComunidade = (id: string) => `/api/comunidade/imagens/${id}`;
export function idImagemComunidade(url: unknown) {
 if (typeof url !== 'string') throw new ErroApi('Imagem inválida.');
 const id = url.startsWith('/api/comunidade/imagens/') ? url.slice(24) : '';
 if (!padraoIdImagem.test(id) || url !== urlImagemComunidade(id)) throw new ErroApi('Use uma imagem enviada pela sua conta.');
 return id;
}
/** Use também na própria escrita que associa o arquivo, para evitar autorização antiga. */
export const imagemDoUsuario = (usuarioId: string, url: string, finalidade: FinalidadeImagem): SQL => sql`exists(
 select 1 from chat_imagens where id=${idImagemComunidade(url)} and usuario_id=${usuarioId} and finalidade=${finalidade}
 and ${ativoSocial(usuarioId)})`;
export async function validarImagemDoUsuario(db: Db, usuario: Usuario, url: unknown, finalidade: FinalidadeImagem) {
 const id = idImagemComunidade(url);
 const [imagem] = await db.all(sql`select 1 where ${imagemDoUsuario(usuario.id, String(url), finalidade)}`);
 if (usuario.suspenso || !imagem) throw new ErroApi('Use uma imagem desta finalidade enviada pela sua conta.', 403);
 return id;
}
export async function podeLerImagem(db: Db, imagem: { id: string; usuarioId: string }, usuario?: Usuario) {
 const leitor = usuario?.id || '', url = urlImagemComunidade(imagem.id);
 const [permitido] = await db.all(sql`select 1 where ${ativoSocial(imagem.usuarioId)} and (
  (${ativoSocial(leitor)} and (${leitor}=${imagem.usuarioId} or ${equipeAtiva(leitor)}))
  or exists(select 1 from chat_mensagens c join usuarios u on u.id=c.autor_id
   where c.imagem_id=${imagem.id} and c.autor_id=${imagem.usuarioId} and c.oculto=0 and c.sala_id is null and u.suspenso=0)
  or exists(select 1 from perfis_sociais p where p.usuario_id=${imagem.usuarioId} and p.avatar=${url})
  or exists(select 1 from perfis_sociais p where p.usuario_id=${imagem.usuarioId} and p.banner=${url} and json_extract(p.visual,'$.capa')='pessoal' and
   (p.publico=1 or (${ativoSocial(leitor)} and ${semBloqueio(leitor, imagem.usuarioId)} and
    (${leitor}=${imagem.usuarioId} or ${amizadeAceita(leitor, imagem.usuarioId)}))))
 )`);
 return !!permitido;
}
