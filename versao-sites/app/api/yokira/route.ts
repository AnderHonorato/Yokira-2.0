import { contexto, estado, mutar, obterTier, publicacoes } from '../../../lib/servidor/yokira';
import { corpoJson, ErroApi, identificador } from '../../../lib/servidor/validacao';
function resposta(valor: unknown, status = 200) { return Response.json(valor, { status, headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } }); }
function falha(erro: unknown) {
    if (erro instanceof ErroApi)
        return resposta({ erro: erro.message, error: erro.message }, erro.status);
    console.error('yokira_api_error');
    return resposta({ erro: 'Não foi possível concluir esta ação. Tente novamente.', error: 'Não foi possível concluir esta ação. Tente novamente.' }, 500);
}
export async function GET(request: Request) {
    try {
        const { db, usuario } = await contexto(request), url = new URL(request.url), acao = url.searchParams.get('acao') || 'estado';
        if (acao === 'estado')
            return resposta(await estado(db, usuario));
        if (acao === 'tier')
            return resposta({ tier: await obterTier(db, identificador(url.searchParams.get('id'))) });
        if (acao === 'publicacao') {
            const [publicacao] = await publicacoes(db, usuario.id, identificador(url.searchParams.get('id')));
            if (!publicacao)
                throw new ErroApi('Publicação não encontrada.', 404);
            return resposta({ publicacao });
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
        return resposta(await mutar(db, usuario, payload));
    }
    catch (erro) {
        return falha(erro);
    }
}
