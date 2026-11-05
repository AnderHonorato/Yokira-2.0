import { sql, type SQL } from 'drizzle-orm';
import { obterAcervo } from './catalogo-administrativo';
import { equipeAtiva, loteAtomico, type Db, type Usuario } from './permissoes';
import { ErroApi, identificador } from './validacao';
import { validarEpisodio, validarTemporada } from './validacao-temporadas';
import { enderecoMidia } from './validacao-acervo';
import { anexarFontesEpisodios, consultasSalvarFontes, type FonteEpisodio } from './fontes-episodio';
import { validarFontesEpisodio } from './validacao-fontes-episodio';

export type Temporada = { id: string; tituloId: string; numero: number; nome: string; ordem: number; arquivado: boolean };
export type Episodio = { id: string; tituloId: string; temporadaId: string | null; numero: number; titulo: string; sinopse: string; duracao: number; videoUrl: string; poster: string; publicado: boolean; estreiaEm: number | null; arquivado: boolean; fontes?: FonteEpisodio[] };
type TemporadaDb = { id: string; titulo_id: string; numero: number; nome: string; ordem: number; arquivado: number };
type EpisodioDb = { id: string; titulo_id: string; temporada_id: string | null; numero: number; titulo: string; sinopse: string; duracao: number; video_url: string; poster: string; publicado: number; estreia_em: number | null; arquivado: number };
const temporada = (p: TemporadaDb): Temporada => ({ id: p.id, tituloId: p.titulo_id, numero: p.numero, nome: p.nome, ordem: p.ordem, arquivado: !!p.arquivado });
const episodio = (p: EpisodioDb): Episodio => ({ id: p.id, tituloId: p.titulo_id, temporadaId: p.temporada_id, numero: p.numero, titulo: p.titulo, sinopse: p.sinopse, duracao: p.duracao, videoUrl: p.video_url, poster: p.poster, publicado: !!p.publicado, estreiaEm: p.estreia_em, arquivado: !!p.arquivado });
function exigirAdministrador(usuario: Usuario) {
    if (usuario.suspenso || usuario.papel !== 'administrador') throw new ErroApi('Somente administradores ativos podem editar temporadas e vídeos.', 403);
}
async function tituloExistente(db: Db, tituloId: string, publico = false) {
    const acervo = await obterAcervo(db, true);
    const titulo = acervo.catalogo.find(p => p.id === tituloId);
    if (!titulo || (publico && titulo.oculto)) throw new ErroApi('Título não encontrado.', 404);
    return titulo;
}
export async function obterTemporadasAdmin(db: Db, usuario: Usuario, valor: unknown) {
    exigirAdministrador(usuario);
    const [autorizado] = await db.all<{ ativo: number }>(sql`select 1 as ativo where ${equipeAtiva(usuario.id, true)}`);
    if (!autorizado) throw new ErroApi('Sua permissão de administrador não está mais ativa.', 403);
    const tituloId = identificador(valor);
    await tituloExistente(db, tituloId);
    const [temporadas, episodios] = await Promise.all([
        db.all<TemporadaDb>(sql`select * from temporadas where titulo_id=${tituloId} order by ordem,numero,id`),
        db.all<EpisodioDb>(sql`select * from episodios where titulo_id=${tituloId} order by numero,id`)
    ]);
    return { temporadas: temporadas.map(temporada), episodios: await anexarFontesEpisodios(db, episodios.map(episodio)) };
}
/** Nenhuma leitura pública devolve endereços de rascunhos, arquivos ou estreias futuras. */
export async function obterEpisodiosPublicos(db: Db, valor: unknown, origem?: string) {
    const tituloId = identificador(valor);
    const titulo = await tituloExistente(db, tituloId, true);
    const [temporadas, episodios] = await Promise.all([
        db.all<TemporadaDb>(sql`select * from temporadas where titulo_id=${tituloId} and arquivado=0 order by ordem,numero,id`),
        db.all<EpisodioDb>(sql`select e.* from episodios e left join temporadas t on t.id=e.temporada_id and t.titulo_id=e.titulo_id
            where e.titulo_id=${tituloId} and ${titulo.tipo === 'Filme' ? sql`e.temporada_id is null and e.numero=1` : sql`e.temporada_id is not null`} and e.arquivado=0 and e.publicado=1 and e.video_url<>''
            and (e.estreia_em is null or e.estreia_em<=${Date.now()}) and (e.temporada_id is null or t.arquivado=0)
            and not exists (select 1 from catalogo_disponibilidade d where d.titulo_id=e.titulo_id and d.oculto=1) order by t.ordem,t.numero,e.numero,e.id`)
    ]);
    const seguros = episodios.filter(p => { try { if (p.video_url) enderecoMidia(p.video_url, 'Vídeo'); if (p.poster) enderecoMidia(p.poster, 'Pôster'); return true; } catch { return false; } });
    const disponiveis = (await anexarFontesEpisodios(db, seguros.map(episodio), true, origem)).filter(p => p.fontes.length);
    const comEpisodios = new Set(disponiveis.map(p => p.temporadaId));
    return { temporadas: temporadas.filter(p => comEpisodios.has(p.id)).map(temporada), episodios: disponiveis };
}
function auditoria(usuario: Usuario, acao: string, tipo: string, id: string, motivo: string): SQL {
    return sql`insert into registros_moderacao(id,autor_id,acao,alvo_tipo,alvo_id,motivo,criado_em)
        select ${crypto.randomUUID()},${usuario.id},${acao},${tipo},${id},${motivo},${Date.now()} where changes()>0`;
}
async function executar(db: Db, usuario: Usuario, comando: SQL, acao: string, tipo: string, id: string, motivo: string, consultas: SQL[] = []) {
    try {
        const [resultado] = await loteAtomico(db, [comando, auditoria(usuario, acao, tipo, id, motivo), ...consultas]);
        if (!resultado.results?.length) throw new ErroApi('Sua permissão de administrador não está mais ativa ou o conteúdo mudou. Atualize a página.', 403);
        return { ok: true, id };
    } catch (erro) {
        let causa: unknown = erro;
        for (let i = 0; causa instanceof Error && i < 6; i++, causa = causa.cause) {
            if (causa.message.includes('episodio_fontes.id')) throw new ErroApi('Uma fonte pertence a outro episódio. Recarregue o editor e adicione-a novamente.', 409);
            if (/UNIQUE constraint|episodios_numero_unico/.test(causa.message)) throw new ErroApi('Este número já está em uso. Edite ou restaure o item existente.', 409);
        }
        throw erro;
    }
}
export async function salvarTemporada(db: Db, usuario: Usuario, payload: Record<string, unknown>) {
    exigirAdministrador(usuario);
    const p = validarTemporada(payload);
    const titulo = await tituloExistente(db, p.tituloId);
    if (titulo.tipo !== 'Série') throw new ErroApi('Filmes têm um vídeo único, sem temporadas.');
    if (p.id) {
        const [atual] = await db.all<{ titulo_id: string }>(sql`select titulo_id from temporadas where id=${p.id}`);
        if (!atual || atual.titulo_id !== p.tituloId) throw new ErroApi('Temporada não encontrada neste título.', 404);
    }
    const id = p.id || crypto.randomUUID(); const agora = Date.now();
    const comando = sql`insert into temporadas(id,titulo_id,numero,nome,ordem,arquivado,criado_em,atualizado_em)
        select ${id},${p.tituloId},${p.numero},${p.nome},${p.ordem},${p.arquivado ? 1 : 0},${agora},${agora} where ${equipeAtiva(usuario.id, true)}
        on conflict(id) do update set numero=excluded.numero,nome=excluded.nome,ordem=excluded.ordem,arquivado=excluded.arquivado,atualizado_em=excluded.atualizado_em
        where temporadas.titulo_id=excluded.titulo_id returning id`;
    return executar(db, usuario, comando, 'salvar-temporada', 'temporada', id, p.motivo);
}
export async function salvarEpisodio(db: Db, usuario: Usuario, payload: Record<string, unknown>, origem?: string) {
    exigirAdministrador(usuario);
    const fontes = validarFontesEpisodio(payload.fontes, origem);
    if (fontes && payload.publicado === true && !fontes.some(p => p.ativo)) throw new ErroApi('Ative ao menos uma fonte antes de publicar.');
    const videoUrl = fontes === undefined ? payload.videoUrl : fontes.find(p => p.ativo)?.url || '';
    const p = validarEpisodio({ ...payload, videoUrl });
    const titulo = await tituloExistente(db, p.tituloId);
    if (titulo.tipo === 'Filme' && (p.temporadaId !== null || p.numero !== 1)) throw new ErroApi('Filmes usam um vídeo único de número 1, sem temporada.');
    if (titulo.tipo === 'Série') {
        if (!p.temporadaId) throw new ErroApi('Selecione uma temporada para este episódio.');
        const [temporada] = await db.all<{ id: string }>(sql`select id from temporadas where id=${p.temporadaId} and titulo_id=${p.tituloId}`);
        if (!temporada) throw new ErroApi('Temporada não encontrada neste título.', 404);
    }
    if (p.id) {
        const [atual] = await db.all<{ titulo_id: string }>(sql`select titulo_id from episodios where id=${p.id}`);
        if (!atual || atual.titulo_id !== p.tituloId) throw new ErroApi('Episódio não encontrado neste título.', 404);
    }
    const id = p.id || crypto.randomUUID(); const agora = Date.now();
    const comando = sql`insert into episodios(id,temporada_id,titulo_id,numero,titulo,sinopse,duracao,video_url,poster,publicado,estreia_em,arquivado,criado_em,atualizado_em)
        select ${id},${p.temporadaId},${p.tituloId},${p.numero},${p.titulo},${p.sinopse},${p.duracao},${p.videoUrl},${p.poster},${p.publicado ? 1 : 0},${p.estreiaEm},${p.arquivado ? 1 : 0},${agora},${agora} where ${equipeAtiva(usuario.id, true)}
        on conflict(id) do update set temporada_id=excluded.temporada_id,numero=excluded.numero,titulo=excluded.titulo,sinopse=excluded.sinopse,duracao=excluded.duracao,video_url=excluded.video_url,poster=excluded.poster,publicado=excluded.publicado,estreia_em=excluded.estreia_em,arquivado=excluded.arquivado,atualizado_em=excluded.atualizado_em
        where episodios.titulo_id=excluded.titulo_id returning id`;
    return executar(db, usuario, comando, 'salvar-episodio', 'episodio', id, p.motivo, consultasSalvarFontes(usuario.id, id, fontes));
}
