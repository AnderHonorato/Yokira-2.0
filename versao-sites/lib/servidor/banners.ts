import { sql } from 'drizzle-orm';
import type { BannerConfig, BannerDestaqueDTO, BannersAdminDTO } from '../banners';
import { obterAcervo } from './catalogo-administrativo';
import { equipeAtiva, loteAtomico, type Db, type Usuario } from './permissoes';
import { ErroApi, identificador, inteiro } from './validacao';
import { camposBanner, validarBanner } from './banners-validacao';
const colunas = sql`id,titulo_id as tituloId,imagem,personagem,link,intervalo_segundos as intervaloSegundos,ordem,ativo,atualizado_em as atualizadoEm`;
function exigirAdmin(usuario: Usuario) {
 if (usuario.suspenso || usuario.papel !== 'administrador') throw new ErroApi('Somente administradores ativos podem editar banners.', 403);
}
async function ler(db: Db) {
 const [linhas, configuracao] = await Promise.all([
  db.all<BannerConfig>(sql`select ${colunas} from banners where arquivado=0 order by ordem,id`),
  db.all<{ intervaloPadraoSegundos: number }>(sql`select intervalo_padrao_segundos as intervaloPadraoSegundos from banners_configuracao where id=1`)
 ]);
 return { banners: linhas.map(item => ({ ...item, ativo: !!item.ativo })), intervaloPadraoSegundos: configuracao[0]?.intervaloPadraoSegundos ?? 8 };
}
export async function obterBanners(db: Db): Promise<BannerDestaqueDTO[]> {
 const [configuracao, acervo] = await Promise.all([ler(db), obterAcervo(db)]);
 return configuracao.banners.flatMap(item => {
  const titulo = acervo.catalogo.find(titulo => titulo.id === item.tituloId);
  return item.ativo && titulo ? [{ ...item, titulo, intervaloEfetivoSegundos: item.intervaloSegundos ?? configuracao.intervaloPadraoSegundos }] : [];
 });
}
export async function obterBannersAdmin(db: Db, usuario: Usuario): Promise<BannersAdminDTO> {
 exigirAdmin(usuario);
 const [permissao] = await db.all<{ autorizado: number }>(sql`select ${equipeAtiva(usuario.id, true)} as autorizado`);
 if (!permissao?.autorizado) throw new ErroApi('Sua permissão de administrador não está mais ativa.', 403);
 const [configuracao, acervo] = await Promise.all([ler(db), obterAcervo(db, true)]);
 return { ...configuracao, catalogo: acervo.catalogo };
}
function auditoria(usuario: Usuario, acao: string, id: string, motivo: string) {
 return sql`insert into registros_moderacao(id,autor_id,acao,alvo_tipo,alvo_id,motivo,criado_em)
  select ${crypto.randomUUID()},${usuario.id},${acao},'banner',${id},${motivo},${Date.now()} where changes()>0`;
}
export async function salvarBanner(db: Db, usuario: Usuario, payload: Record<string, unknown>) {
 exigirAdmin(usuario); const p = validarBanner(payload); const id = p.id ?? crypto.randomUUID();
 const acervo = await obterAcervo(db, true);
 if (!acervo.catalogo.some(titulo => titulo.id === p.tituloId)) throw new ErroApi('Título não encontrado.', 404);
 if (p.id) { const [atual] = await db.all(sql`select id from banners where id=${id} and arquivado=0`); if (!atual) throw new ErroApi('Banner não encontrado.', 404); }
 const [alterado] = await loteAtomico(db, [
  sql`insert into banners(id,titulo_id,imagem,personagem,link,intervalo_segundos,ordem,ativo,atualizado_em)
   select ${id},${p.tituloId},${p.imagem},${p.personagem},${p.link},${p.intervaloSegundos},${p.ordem},${p.ativo ? 1 : 0},${Date.now()} where ${equipeAtiva(usuario.id, true)}
   on conflict(id) do update set titulo_id=excluded.titulo_id,imagem=excluded.imagem,personagem=excluded.personagem,link=excluded.link,
   intervalo_segundos=excluded.intervalo_segundos,ordem=excluded.ordem,ativo=excluded.ativo,atualizado_em=max(banners.atualizado_em+1,excluded.atualizado_em)
   where banners.arquivado=0 returning id`, auditoria(usuario, 'salvar-banner', id, p.motivo)
 ]);
 if (!alterado.results.length) throw new ErroApi('Sua permissão de administrador não está mais ativa.', 403);
 return { ok: true, id };
}
export async function arquivarBanner(db: Db, usuario: Usuario, payload: Record<string, unknown>) {
 exigirAdmin(usuario); const motivo = camposBanner(payload, ['id']); const id = identificador(payload.id);
 const [alterado] = await loteAtomico(db, [
  sql`update banners set arquivado=1,ativo=0,atualizado_em=max(atualizado_em+1,${Date.now()}) where id=${id} and arquivado=0 and ${equipeAtiva(usuario.id, true)} returning id`,
  auditoria(usuario, 'arquivar-banner', id, motivo)
 ]);
 if (!alterado.results.length) throw new ErroApi('Banner indisponível ou permissão de administrador inativa.', 403);
 return { ok: true };
}
export async function configurarBanners(db: Db, usuario: Usuario, payload: Record<string, unknown>) {
 exigirAdmin(usuario); const motivo = camposBanner(payload, ['intervaloPadraoSegundos']);
 const intervalo = inteiro(payload.intervaloPadraoSegundos, 'Tempo padrão', 3, 60);
 const [alterado] = await loteAtomico(db, [
  sql`update banners_configuracao set intervalo_padrao_segundos=${intervalo},atualizado_em=max(atualizado_em+1,${Date.now()}) where id=1 and ${equipeAtiva(usuario.id, true)} returning id`,
  auditoria(usuario, 'configurar-banners', 'global', motivo)
 ]);
 if (!alterado.results.length) throw new ErroApi('Sua permissão de administrador não está mais ativa.', 403);
 return { ok: true };
}
