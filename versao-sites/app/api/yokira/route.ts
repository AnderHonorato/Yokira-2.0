import { getDb } from '../../../db';
import { contexto, estado, estadoPublico, mutar, obterTier, publicacoes } from '../../../lib/servidor/yokira';
import { listarModeracao } from '../../../lib/servidor/moderacao';
import { obterAcervo, salvarAcervo } from '../../../lib/servidor/catalogo-administrativo';
import { listarNotificacoes, verNotificacoes } from '../../../lib/servidor/notificacoes';
import { obterTemporadasAdmin, obterEpisodiosPublicos, salvarTemporada, salvarEpisodio } from '../../../lib/servidor/temporadas';
import { salvarProgressoEpisodio, obterProgressoEpisodio } from '../../../lib/servidor/progresso-episodios';
import { exigirAtivo } from '../../../lib/servidor/permissoes';
import { corpoJson, ErroApi, identificador } from '../../../lib/servidor/validacao';
function resposta(valor: unknown, status = 200) {
    return Response.json(valor, { status, headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
}
function falha(erro: unknown) {
    if (erro instanceof ErroApi)
        return resposta({ erro: erro.message, error: erro.message }, erro.status);
    console.error('yokira_api_error');
    return resposta({ erro: 'Não foi possível concluir esta ação. Tente novamente.', error: 'Não foi possível concluir esta ação. Tente novamente.' }, 500);
}
export async function GET(request: Request) {
    try {
        const url = new URL(request.url), acao = url.searchParams.get('acao') || 'estado';
        // Somente informações públicas: nenhuma lista, nota, progresso ou jogo pessoal.
        if (acao === 'publico') {
            const [comunidade, acervo] = await Promise.all([estadoPublico(), obterAcervo(getDb())]);
            return resposta({...comunidade, ...acervo});
        }
        if (acao === 'episodios')
            return resposta(await obterEpisodiosPublicos(getDb(), identificador(url.searchParams.get('tituloId')), url.origin));
        if (acao === 'tier')
            return resposta({ tier: await obterTier(getDb(), identificador(url.searchParams.get('id'))) });
        if (acao === 'publicacao') {
            const id = identificador(url.searchParams.get('id'));
            const usuarioId = request.headers.get('oai-authenticated-user-id') || '';
            const [publicacao] = await publicacoes(getDb(), usuarioId, id);
            if (!publicacao)
                throw new ErroApi('Publicação não encontrada.', 404);
            return resposta({ publicacao });
        }
        const { db, usuario } = await contexto(request);
        if (acao === 'progresso-episodio') return resposta({segundos: await obterProgressoEpisodio(db, usuario, identificador(url.searchParams.get('episodioId')))});
        if (acao === 'notificacoes') return resposta({notificacoes: await listarNotificacoes(db, usuario)});
        if (acao === 'temporadas-admin') return resposta(await obterTemporadasAdmin(db, usuario, identificador(url.searchParams.get('tituloId'))));
        if (acao === 'acervo-admin') {
            exigirAtivo(usuario);
            if (usuario.papel !== 'administrador') throw new ErroApi('Somente administradores podem editar o acervo.', 403);
            return resposta(await obterAcervo(db, true));
        }
        if (acao === 'moderacao') return resposta(await listarModeracao(db, usuario, url.searchParams.get('busca') || ''));
        if (acao === 'estado') {
            const [pessoal, acervo] = await Promise.all([estado(db, usuario), obterAcervo(db)]);
            return resposta({...pessoal, ...acervo});
        }
        throw new ErroApi('Ação desconhecida.');
    }
    catch (erro) {
        return falha(erro);
    }
}
export async function POST(request: Request) {
    try {
        const payload = await corpoJson(request), { db, usuario } = await contexto(request);
        if (payload.acao === 'notificacoes-ver') return resposta(await verNotificacoes(db, usuario, payload));
        if (payload.acao === 'salvar-acervo') return resposta(await salvarAcervo(db, usuario, payload));
        if (payload.acao === 'salvar-temporada') return resposta(await salvarTemporada(db, usuario, payload));
        if (payload.acao === 'salvar-episodio') return resposta(await salvarEpisodio(db, usuario, payload, new URL(request.url).origin));
        if (payload.acao === 'progresso-episodio') return resposta(await salvarProgressoEpisodio(db, usuario, payload));
        return resposta(await mutar(db, usuario, payload));
    }
    catch (erro) {
        return falha(erro);
    }
}
