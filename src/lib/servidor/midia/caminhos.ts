// Arquivo: src/lib/servidor/midia/caminhos.ts
// Onde o HLS mora. Ha uma funcao so pra responder isso porque a pasta errada aqui abre
// um buraco inteiro: dentro de static/ o SvelteKit entrega os segmentos como arquivo
// publico, sem passar por sessao nem por assinatura.

import { join, resolve, sep } from 'node:path';

export const PASTA_HLS_PADRAO = './midia/hls';

function dentroDeStatic(absoluta: string): boolean {
  const raiz = resolve('static');
  return absoluta === raiz || absoluta.startsWith(raiz + sep);
}

/**
 * Pasta raiz do HLS, em caminho absoluto. Lida a cada chamada de proposito: o teste
 * troca `PASTA_HLS` depois de o modulo ja ter sido importado.
 */
export function pastaDeHls(): string {
  const configurada = process.env.PASTA_HLS?.trim() || PASTA_HLS_PADRAO;
  const absoluta = resolve(configurada);

  if (dentroDeStatic(absoluta)) {
    throw new Error(
      `PASTA_HLS aponta para dentro de static/ (${configurada}). Os segmentos sairiam ` +
        'como arquivo publico, sem sessao nem assinatura. Use ./midia/hls.'
    );
  }

  return absoluta;
}

/** Pasta de um arquivo de midia especifico, ja dentro da raiz validada. */
export function pastaDoArquivo(arquivoId: string): string {
  return join(pastaDeHls(), arquivoId);
}
