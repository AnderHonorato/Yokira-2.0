import { sql } from 'drizzle-orm';
import { obterAcervo } from './catalogo-administrativo';
import { equipeAtiva, loteAtomico, type Db, type Usuario } from './permissoes';
import { ErroApi } from './validacao';
import { intervaloMidia, limitarFluxoMidia, validarEnvioMidia } from './validacao-midia';

type Midia = { id: string; chave: string; tipo: 'video' | 'imagem'; mime: string; tamanho: number };
export function falhaMidia(erro: unknown) {
    const mensagem = erro instanceof ErroApi ? erro.message : 'Não foi possível concluir o envio ou abrir a mídia. Tente novamente.';
    if (!(erro instanceof ErroApi)) console.error('yokira_midia_error');
    return Response.json({ erro: mensagem, error: mensagem }, {
        status: erro instanceof ErroApi ? erro.status : 500,
        headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' }
    });
}
export function exigirBucket(bucket?: R2Bucket): R2Bucket {
    if (!bucket) throw new ErroApi('O armazenamento de mídia ainda não está configurado. Use uma URL externa ou tente novamente após ativar o armazenamento do servidor.', 503);
    return bucket;
}
async function administradorAtivo(db: Db, usuario?: Usuario): Promise<boolean> {
    if (!usuario || usuario.suspenso || usuario.papel !== 'administrador') return false;
    const [ativo] = await db.all<{ ativo: number }>(sql`select 1 as ativo where ${equipeAtiva(usuario.id, true)}`);
    return !!ativo;
}
export async function enviarMidia(db: Db, usuario: Usuario, bucket: R2Bucket, request: Request) {
    if (usuario.suspenso || usuario.papel !== 'administrador') throw new ErroApi('Somente administradores ativos podem enviar mídia.', 403);
    const p = validarEnvioMidia(request), id = crypto.randomUUID();
    const chave = `midia/${crypto.randomUUID()}.${p.extensao}`, agora = Date.now();
    const [criado] = await db.all<{ id: string }>(sql`insert into midia(id,dono_id,chave,nome,tipo,mime,tamanho,status,criado_em,atualizado_em)
        select ${id},${usuario.id},${chave},${p.nome},${p.tipo},${p.mime},${p.tamanho},'enviando',${agora},${agora}
        where ${equipeAtiva(usuario.id, true)} returning id`);
    if (!criado) throw new ErroApi('Sua permissão de administrador não está mais ativa.', 403);
    const cancelamento = new AbortController();
    try {
        // R2 exige tamanho conhecido: FixedLengthStream preserva streaming e confere o comprimento.
        const fixo = new FixedLengthStream(p.tamanho);
        const fluxo = limitarFluxoMidia(request.body!, p.tamanho).pipeTo(fixo.writable, { signal: cancelamento.signal });
        await Promise.all([fluxo, bucket.put(chave, fixo.readable, { httpMetadata: { contentType: p.mime } })]);
        const [concluido] = await loteAtomico(db, [sql`update midia set status='pronto',atualizado_em=${Date.now()}
            where id=${id} and status='enviando' and ${equipeAtiva(usuario.id, true)} returning id`,
            sql`insert into registros_moderacao(id,autor_id,acao,alvo_tipo,alvo_id,motivo,criado_em)
                select ${crypto.randomUUID()},${usuario.id},'enviar-midia','midia',${id},'Arquivo enviado para o armazenamento do servidor.',${Date.now()} where changes()>0`]);
        if (!concluido.results?.length) throw new ErroApi('Sua permissão de administrador mudou durante o envio. O arquivo não foi publicado.', 403);
        return { id, url: `/api/midia/${id}`, tipo: p.tipo, tamanho: p.tamanho };
    } catch (erro) {
        cancelamento.abort();
        await Promise.allSettled([
            bucket.delete(chave),
            db.run(sql`update midia set status='falhou',atualizado_em=${Date.now()} where id=${id}`)
        ]);
        throw erro;
    }
}
async function midiaPublica(db: Db, id: string, tipo: Midia['tipo']) {
    const url = `/api/midia/${id}`;
    const acervo = await obterAcervo(db);
    if (tipo === 'imagem' && (acervo.catalogo.some(t => t.poster === url || t.capa === url) || acervo.editoriais.some(e => e.imagem === url))) return true;
    if (tipo === 'imagem') {
        const banners = await db.all<{ tituloId: string }>(sql`select titulo_id as tituloId from banners
            where arquivado=0 and ativo=1 and (imagem=${url} or personagem=${url})`);
        if (banners.some(b => acervo.catalogo.some(t => t.id === b.tituloId))) return true;
    }
    const referencias = await db.all<{ titulo_id: string; temporada_id: string | null; numero: number }>(sql`select distinct e.titulo_id,e.temporada_id,e.numero from episodios e
        left join temporadas t on t.id=e.temporada_id and t.titulo_id=e.titulo_id
        where ${tipo === 'imagem' ? sql`e.poster=${url}` : sql`(e.video_url=${url} or exists(select 1 from episodio_fontes f where f.episodio_id=e.id and f.ativo=1 and f.tipo='direto' and f.url=${url}))`}
        and e.publicado=1 and e.arquivado=0 and (e.estreia_em is null or e.estreia_em<=${Date.now()})
        and (e.temporada_id is null or t.arquivado=0)
        and not exists(select 1 from catalogo_disponibilidade d where d.titulo_id=e.titulo_id and d.oculto=1)`);
    if (!referencias.length) return false;
    return referencias.some(r => acervo.catalogo.some(t => t.id === r.titulo_id && !t.oculto
        && (t.tipo === 'Filme' ? r.temporada_id === null && r.numero === 1 : r.temporada_id !== null)));
}
export async function obterMidia(db: Db, bucket: R2Bucket, request: Request, id: string, usuario?: Usuario) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) throw new ErroApi('Mídia não encontrada.', 404);
    const [midia] = await db.all<Midia>(sql`select id,chave,tipo,mime,tamanho from midia where id=${id} and status='pronto'`);
    if (!midia) throw new ErroApi('Mídia não encontrada.', 404);
    if (!await administradorAtivo(db, usuario) && !await midiaPublica(db, id, midia.tipo)) throw new ErroApi('Mídia não encontrada.', 404);
    const headers = new Headers({
        'Content-Type': midia.mime, 'X-Content-Type-Options': 'nosniff', 'Accept-Ranges': 'bytes',
        // Consulta a visibilidade em cada requisição, inclusive depois de ocultar um título.
        'Cache-Control': 'private, no-store', 'Content-Length': String(midia.tamanho)
    });
    let range;
    try { range = intervaloMidia(request.headers.get('range'), midia.tamanho); }
    catch (erro) {
        if (!(erro instanceof ErroApi) || erro.status !== 416) throw erro;
        headers.set('Content-Range', `bytes */${midia.tamanho}`);
        headers.set('Content-Length', '0');
        return new Response(null, { status: 416, headers });
    }
    if (range) {
        headers.set('Content-Range', `bytes ${range.inicio}-${range.fim}/${midia.tamanho}`);
        headers.set('Content-Length', String(range.comprimento));
    }
    if (request.method === 'HEAD') {
        if (!await bucket.head(midia.chave)) throw new ErroApi('Mídia não encontrada.', 404);
        return new Response(null, { status: range ? 206 : 200, headers });
    }
    // O intervalo já foi validado; passar Headers mantém a semântica Range do R2.
    const objeto = await bucket.get(midia.chave, range ? { range: request.headers } : undefined);
    if (!objeto) throw new ErroApi('Mídia não encontrada.', 404);
    return new Response(objeto.body, { status: range ? 206 : 200, headers });
}
