import { env } from 'cloudflare:workers';
import { contexto } from '../../../../lib/servidor/yokira';
import { enviarImagemComunidade } from '../../../../lib/servidor/imagens-comunidade';
import { exigirBucket, falhaMidia } from '../../../../lib/servidor/midia';

export async function POST(request: Request) {
 try {
  const { db, usuario } = await contexto(request);
  const resultado = await enviarImagemComunidade(db, usuario, exigirBucket(env.BUCKET), request);
  return Response.json(resultado, { status: 201, headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
 } catch (erro) { return falhaMidia(erro); }
}
