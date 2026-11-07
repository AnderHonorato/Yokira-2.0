import { sql, type SQL } from 'drizzle-orm';
import type { Db, Usuario } from './permissoes';
import { ErroApi, identificador } from './validacao';
import { ativoSocial, colunasPessoa, pessoa, relacaoSql, semBloqueio } from './social-base';
import { obterAcervo } from './catalogo-administrativo';
import { listarDestaquesConquistas } from './conquistas';
import {visualEquipado} from './personalizacao-perfil';
import {visualPerfilPadrao} from '../personalizacao-perfil';
import type { AtividadePerfil, CartaoPerfil, PessoaSocial } from '../social';

export const acessoPerfil = (visitante: string, alvo: SQL): SQL => sql`(p.publico=1 or
 (${ativoSocial(visitante)} and (${alvo}=${visitante} or exists(select 1 from amizades
 where usuario_a=min(${visitante},${alvo}) and usuario_b=max(${visitante},${alvo}) and estado='aceita'))))`;
export function imagemPerfil(valor: unknown): string {
 if (typeof valor !== 'string' || (valor !== '' && !/^\/api\/comunidade\/imagens\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(valor)))
  throw new ErroApi('Envie uma imagem pelo seletor da comunidade.');
 return valor;
}
/** A propriedade e a finalidade são conferidas dentro da própria atualização. */
export function imagemPropria(url: string, finalidade: 'avatar' | 'banner', usuarioId: string): SQL {
 return url === '' ? sql`1=1` : sql`exists(select 1 from chat_imagens where id=${url.split('/').at(-1)!}
 and usuario_id=${usuarioId} and finalidade=${finalidade})`;
}
export async function obterAtividadePerfil(db: Db, alvoId: string, visitante = ''): Promise<AtividadePerfil | null> {
 const [linha] = await db.all<Omit<AtividadePerfil, 'titulo'> & { temporadaId: string | null }>(sql`select a.titulo_id as tituloId,
 a.episodio_id as episodioId,e.numero as episodio,a.atualizado_em as atualizadoEm,e.temporada_id as temporadaId
 from atividade_perfis a join perfis_sociais p on p.usuario_id=a.usuario_id join usuarios u on u.id=a.usuario_id
 join episodios e on e.id=a.episodio_id and e.titulo_id=a.titulo_id
 left join temporadas t on t.id=e.temporada_id and t.titulo_id=e.titulo_id
 where a.usuario_id=${alvoId} and p.compartilhar_atividade=1 and u.suspenso=0
 and ${acessoPerfil(visitante, sql`a.usuario_id`)} and ${semBloqueio(visitante, alvoId)}
 and e.publicado=1 and e.arquivado=0 and e.video_url<>'' and (e.estreia_em is null or e.estreia_em<=${Date.now()})
 and (e.temporada_id is null or t.arquivado=0)
 and not exists(select 1 from catalogo_disponibilidade d where d.titulo_id=a.titulo_id and d.oculto=1) limit 1`);
 if (!linha) return null;
 const titulo = (await obterAcervo(db)).catalogo.find(t => t.id === linha.tituloId);
 if (!titulo || (titulo.tipo === 'Filme' ? linha.episodio !== 1 || linha.temporadaId !== null : linha.temporadaId === null)) return null;
 return { tituloId: linha.tituloId, episodioId: linha.episodioId, episodio: Number(linha.episodio), atualizadoEm: Number(linha.atualizadoEm), titulo: titulo.nome };
}
export async function obterCartaoPerfil(db: Db, valor: unknown, usuario: Usuario | null = null): Promise<{ perfil: CartaoPerfil }> {
 const alvoId = identificador(valor), id = usuario?.id || '';
 const [linha] = await db.all<PessoaSocial & { avatar: string; banner: string; visual:string; acessivel: number; mostrar: number }>(sql`
 select ${colunasPessoa},${relacaoSql(id)},p.avatar,case when ${acessoPerfil(id, sql`u.id`)} then p.banner else '' end as banner,
 ${acessoPerfil(id, sql`u.id`)} as acessivel,p.mostrar_conquistas as mostrar,p.visual
 from usuarios u join perfis_sociais p on p.usuario_id=u.id
 left join amizades a on a.usuario_a=min(${id},u.id) and a.usuario_b=max(${id},u.id)
 where u.id=${alvoId} and u.suspenso=0 and ${semBloqueio(id, alvoId)} limit 1`);
 if (!linha) throw new ErroApi('Perfil não encontrado ou indisponível.', 404);
 const conquistas = linha.acessivel && (linha.mostrar || linha.id === id) ? (await listarDestaquesConquistas(db, alvoId)).slice(0, 3) : [];
 const visual=linha.acessivel?await visualEquipado(db,alvoId,linha.visual):{...visualPerfilPadrao};
 return { perfil: { ...pessoa(linha), visual, avatar: linha.avatar, banner:visual.capa==='pessoal'?linha.banner:'', acessivel: !!linha.acessivel,
  conquistas, atividade: linha.acessivel ? await obterAtividadePerfil(db, alvoId, id) : null } };
}
