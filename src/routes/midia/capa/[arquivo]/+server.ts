// Arquivo: src/routes/midia/capa/[arquivo]/+server.ts
// Serve as capas, que moram fora de static/ como o resto da midia. Ao contrario do HLS
// nao ha assinatura: a capa aparece no catalogo publico, e exigir sessao esconderia a
// imagem de quem ainda nao tem conta. O que fecha aqui e a lista de nomes aceitos.

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { error } from '@sveltejs/kit';
import { pastaDeCapas } from '$servidor/midia/capas';
import { nomeDeCapaValido, TIPO_POR_FORMATO, type FormatoDeImagem } from '$servidor/midia/imagens';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, setHeaders }) => {
  const { arquivo } = params;
  // Nome fora do padrao nao chega a tocar o disco: e o que barra "../".
  if (!nomeDeCapaValido(arquivo)) throw error(400, 'Nome de capa inválido.');

  const bytes = await readFile(join(pastaDeCapas(), arquivo)).catch(() => null);
  if (!bytes) throw error(404, 'Capa não encontrada.');

  const extensao = arquivo.split('.').pop() as FormatoDeImagem;

  setHeaders({
    'content-type': TIPO_POR_FORMATO[extensao],
    // O nome e sorteado e o conteudo nunca muda: trocar a capa gera outro nome.
    'cache-control': 'public, max-age=31536000, immutable',
    // O tipo vem da nossa lista, nao do palpite do navegador.
    'x-content-type-options': 'nosniff'
  });

  return new Response(new Uint8Array(bytes));
};
