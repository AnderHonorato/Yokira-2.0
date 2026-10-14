// Arquivo: src/routes/midia/hls/[arquivoId]/[recurso]/+server.ts
// A unica porta por onde HLS sai. A ordem das checagens importa: sessao primeiro, nome
// na lista fechada depois, assinatura por ultimo. Assim um nome inventado e recusado
// antes de tocar o disco e antes de gastar um HMAC.

import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { error } from '@sveltejs/kit';
import {
  ehPlaylist,
  identificadorValido,
  recursoValido,
  urlAssinada,
  verificarAssinatura,
  type RecursoAssinado
} from '$servidor/midia/assinatura-hls';
import { pastaDeHls } from '$servidor/midia/caminhos';
import { interpretarFaixa } from '$servidor/midia/faixa-bytes';
import { reescreverPlaylist } from '$servidor/midia/playlist-assinada';
import type { RequestHandler } from './$types';

/** Corpo em fluxo: um segmento de 6 s nao precisa passar inteiro pela memoria. */
function fluxo(leitura: ReturnType<typeof createReadStream>): ReadableStream {
  return Readable.toWeb(leitura) as unknown as ReadableStream;
}

async function entregarPlaylist(caminho: string, dados: RecursoAssinado): Promise<Response> {
  const original = await readFile(caminho, 'utf8');

  // Os itens de dentro herdam o prazo da playlist que os listou. Assinar com prazo
  // maior daria ao segmento uma vida que a playlist nao tem.
  const corpo = reescreverPlaylist(original, (interno) =>
    urlAssinada({ ...dados, recurso: interno })
  );

  return new Response(corpo, {
    headers: {
      'content-type': 'application/vnd.apple.mpegurl',
      // Playlist e pessoal: em cache compartilhado ela entregaria os links de um
      // usuario para outro.
      'cache-control': 'private, no-store'
    }
  });
}

function entregarSegmento(caminho: string, tamanho: number, pedido: Request): Response {
  const faixa = interpretarFaixa(pedido.headers.get('range'), tamanho);

  const cabecalhos: Record<string, string> = {
    'content-type': 'video/mp2t',
    'accept-ranges': 'bytes',
    // O conteudo do segmento nunca muda, mas o link e pessoal: private, nunca public.
    'cache-control': 'private, max-age=3600'
  };

  if (!faixa) {
    cabecalhos['content-length'] = String(tamanho);
    return new Response(fluxo(createReadStream(caminho)), { status: 200, headers: cabecalhos });
  }

  cabecalhos['content-length'] = String(faixa.fim - faixa.inicio + 1);
  cabecalhos['content-range'] = `bytes ${faixa.inicio}-${faixa.fim}/${tamanho}`;

  return new Response(fluxo(createReadStream(caminho, { start: faixa.inicio, end: faixa.fim })), {
    status: 206,
    headers: cabecalhos
  });
}

export const GET: RequestHandler = async ({ params, url, locals, request }) => {
  if (!locals.usuario) throw error(401, 'Entre na sua conta para assistir.');

  const { arquivoId, recurso } = params;
  if (!identificadorValido(arquivoId) || !recursoValido(recurso)) {
    throw error(400, 'Recurso de mídia inválido.');
  }

  const dados: RecursoAssinado = {
    arquivoId,
    recurso,
    usuarioId: locals.usuario.id,
    expiraEm: Number(url.searchParams.get('exp'))
  };

  if (!verificarAssinatura(dados, url.searchParams.get('sig') ?? '', Date.now())) {
    throw error(403, 'Link de mídia inválido ou vencido.');
  }

  const caminho = join(pastaDeHls(), arquivoId, recurso);
  const informacao = await stat(caminho).catch(() => null);
  if (!informacao?.isFile()) throw error(404, 'Mídia não encontrada.');

  if (ehPlaylist(recurso)) return entregarPlaylist(caminho, dados);
  return entregarSegmento(caminho, informacao.size, request);
};
