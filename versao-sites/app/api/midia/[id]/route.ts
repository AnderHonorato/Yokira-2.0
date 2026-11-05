import { env } from 'cloudflare:workers';
import { getDb } from '../../../../db';
import { contexto } from '../../../../lib/servidor/yokira';
import { exigirBucket, obterMidia, falhaMidia } from '../../../../lib/servidor/midia';

type Parametros = { params: Promise<{ id: string }> };
async function servir(request: Request, { params }: Parametros) {
    try {
        const { id } = await params;
        const usuario = request.headers.has('oai-authenticated-user-id') ? (await contexto(request)).usuario : undefined;
        return await obterMidia(getDb(), exigirBucket(env.BUCKET), request, id, usuario);
    } catch (erro) {
        const resposta = falhaMidia(erro);
        return request.method === 'HEAD' ? new Response(null, { status: resposta.status, headers: resposta.headers }) : resposta;
    }
}
export const GET = servir;
export const HEAD = servir;
