import { env } from 'cloudflare:workers';
import { getDb } from '../../../../../db';
import { contexto } from '../../../../../lib/servidor/yokira';
import { obterImagemComunidade } from '../../../../../lib/servidor/imagens-comunidade';
import { exigirBucket, falhaMidia } from '../../../../../lib/servidor/midia';
import { ErroApi } from '../../../../../lib/servidor/validacao';

type Parametros = { params: Promise<{ id: string }> };
async function servir(request: Request, { params }: Parametros) {
 try {
  let usuario;
  if (request.headers.has('oai-authenticated-user-id') || request.headers.has('cookie')) {
   try { usuario = (await contexto(request)).usuario; }
   catch (erro) { if (!(erro instanceof ErroApi) || erro.status !== 401) throw erro; }
  }
  return await obterImagemComunidade(getDb(), exigirBucket(env.BUCKET), request, (await params).id, usuario);
 } catch (erro) {
  const resposta = falhaMidia(erro);
  return request.method === 'HEAD' ? new Response(null, { status: resposta.status, headers: resposta.headers }) : resposta;
 }
}
export const GET = servir;
export const HEAD = servir;
