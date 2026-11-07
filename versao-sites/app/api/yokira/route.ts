import { getDb } from '../../../db';
import { contexto, estado, estadoPublico, mutar, obterTier, publicacoes } from '../../../lib/servidor/yokira';
import { listarModeracao } from '../../../lib/servidor/moderacao';
import { obterAcervo, salvarAcervo } from '../../../lib/servidor/catalogo-administrativo';
import { listarNotificacoes, verNotificacoes } from '../../../lib/servidor/notificacoes';
import { obterTemporadasAdmin, obterEpisodiosPublicos, salvarTemporada, salvarEpisodio } from '../../../lib/servidor/temporadas';
import { salvarProgressoEpisodio, obterProgressoEpisodio } from '../../../lib/servidor/progresso-episodios';
import { exigirAtivo } from '../../../lib/servidor/permissoes';
import { obterAparencia, salvarAparencia } from '../../../lib/servidor/aparencia';
import { corpoJson, ErroApi, identificador } from '../../../lib/servidor/validacao';
import { listarConquistas, equiparConquistas } from '../../../lib/servidor/conquistas';
import { obterPerfilPublico, obterPerfilSocial, listarAmizades, salvarPerfilSocial, alterarAmizade, consultarHandle } from '../../../lib/servidor/social';
import { obterSalas, obterSala, mutarSala } from '../../../lib/servidor/salas';
import { obterBanners, obterBannersAdmin, salvarBanner, arquivarBanner, configurarBanners } from '../../../lib/servidor/banners';
import { listarMensagensSalasAdmin, moderarMensagemSala } from '../../../lib/servidor/salas-moderacao';
import { listarChatGlobal } from '../../../lib/servidor/chat-global';
import { enviarChatGlobal } from '../../../lib/servidor/chat-global-escrita';
import { listarChatModeracao, moderarChatGlobal } from '../../../lib/servidor/chat-global-moderacao';
import { obterCartaoPerfil } from '../../../lib/servidor/perfis-ricos';
import { registrarAtividadeVideo } from '../../../lib/servidor/atividade-video';
async function usuarioOpcional(request: Request) {
    try { return (await contexto(request)).usuario; }
    catch (erro) { if (erro instanceof ErroApi && erro.status === 401) return null; throw erro; }
}
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
        if (acao === 'chat-global') return resposta(await listarChatGlobal(getDb(), await usuarioOpcional(request)));
        if (acao === 'cartao-perfil') return resposta(await obterCartaoPerfil(getDb(), url.searchParams.get('usuarioId'), await usuarioOpcional(request)));
        if (acao === 'aparencia') return resposta({aparencia: await obterAparencia(getDb())});
        if (acao === 'banners') return resposta({banners: await obterBanners(getDb())});
        if (acao === 'perfil-publico') return resposta(await obterPerfilPublico(getDb(), url.searchParams.get('handle') || '', await usuarioOpcional(request)));
        // Somente informações públicas: nenhuma lista, nota, progresso ou jogo pessoal.
        if (acao === 'publico') {
            const [comunidade, acervo, aparencia] = await Promise.all([estadoPublico(), obterAcervo(getDb()), obterAparencia(getDb())]);
            return resposta({...comunidade, ...acervo, aparencia});
        }
        if (acao === 'episodios')
            return resposta(await obterEpisodiosPublicos(getDb(), identificador(url.searchParams.get('tituloId')), url.origin));
        if (acao === 'tier')
            return resposta({ tier: await obterTier(getDb(), identificador(url.searchParams.get('id'))) });
        if (acao === 'publicacao') {
            const id = identificador(url.searchParams.get('id'));
            const usuarioId = (await usuarioOpcional(request))?.id || '';
            const [publicacao] = await publicacoes(getDb(), usuarioId, id);
            if (!publicacao)
                throw new ErroApi('Publicação não encontrada.', 404);
            return resposta({ publicacao });
        }
        const { db, usuario } = await contexto(request);
        if (acao === 'chat-global-moderacao') return resposta(await listarChatModeracao(db, usuario, url.searchParams.get('busca') || ''));
        if (acao === 'banners-admin') return resposta(await obterBannersAdmin(db, usuario));
        if (acao === 'salas-moderacao') return resposta(await listarMensagensSalasAdmin(db, usuario, url.searchParams.get('busca') || ''));
        if (acao === 'conquistas') return resposta(await listarConquistas(db, usuario));
        if (acao === 'perfil-social') return resposta(await obterPerfilSocial(db, usuario));
        if (acao === 'handle-disponivel') return resposta(await consultarHandle(db, usuario, url.searchParams.get('handle')));
        if (acao === 'amizades') return resposta(await listarAmizades(db, usuario, url.searchParams.get('busca') || ''));
        if (acao === 'salas') return resposta(await obterSalas(db, usuario));
        if (acao === 'sala') return resposta(await obterSala(db, usuario, identificador(url.searchParams.get('salaId')), url.origin));
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
            const [pessoal, acervo, aparencia] = await Promise.all([estado(db, usuario), obterAcervo(db), obterAparencia(db)]);
            return resposta({...pessoal, ...acervo, aparencia});
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
        if (payload.acao === 'chat-global-enviar') return resposta(await enviarChatGlobal(db, usuario, payload));
        if (payload.acao === 'chat-global-moderar') return resposta(await moderarChatGlobal(db, usuario, payload));
        if (payload.acao === 'atividade-video') return resposta(await registrarAtividadeVideo(db, usuario, payload));
        if (payload.acao === 'salvar-banner') return resposta(await salvarBanner(db, usuario, payload));
        if (payload.acao === 'arquivar-banner') return resposta(await arquivarBanner(db, usuario, payload));
        if (payload.acao === 'configurar-banners') return resposta(await configurarBanners(db, usuario, payload));
        if (payload.acao === 'moderar-mensagem-sala') return resposta(await moderarMensagemSala(db, usuario, payload));
        if (payload.acao === 'equipar-conquistas') return resposta(await equiparConquistas(db, usuario, payload));
        if (payload.acao === 'salvar-perfil-social') return resposta(await salvarPerfilSocial(db, usuario, payload));
        if (payload.acao === 'amizade') return resposta(await alterarAmizade(db, usuario, payload));
        if (typeof payload.acao === 'string' && payload.acao.startsWith('sala-')) return resposta(await mutarSala(db, usuario, payload, new URL(request.url).origin));
        if (payload.acao === 'salvar-aparencia') return resposta(await salvarAparencia(db, usuario, payload));
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
