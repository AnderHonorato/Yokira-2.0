// Arquivo: src/lib/servidor/midia/capas.ts
// Onde as capas moram e como elas viram URL. Elas ficam FORA de static/ como o resto
// da midia, mas ao contrario do HLS nao sao assinadas: capa aparece no catalogo, que e
// publico. O que protege aqui e o nome sorteado e a lista fechada de nomes aceitos.

import { mkdir, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { join, resolve } from 'node:path';
import { formatoDaImagem, type FormatoDeImagem } from './imagens.js';

export const PASTA_DE_CAPAS_PADRAO = './midia/capas';

export function pastaDeCapas(): string {
  return resolve(process.env.PASTA_CAPAS?.trim() || PASTA_DE_CAPAS_PADRAO);
}

/** URL publica da capa. E o que vai pro banco, nao o caminho de disco. */
export function urlDaCapa(nome: string): string {
  return `/midia/capa/${nome}`;
}

export class ErroDeCapa extends Error {}

/**
 * Grava a imagem e devolve a URL. O formato sai dos bytes: um arquivo chamado .png
 * com outra coisa dentro e recusado aqui, antes de virar arquivo servido pela
 * nossa origem.
 */
export async function gravarCapa(bytes: Buffer): Promise<string> {
  const formato: FormatoDeImagem | null = formatoDaImagem(bytes);
  if (!formato) throw new ErroDeCapa('A imagem precisa ser JPEG, PNG ou WebP.');

  const pasta = pastaDeCapas();
  await mkdir(pasta, { recursive: true });

  const nome = `${randomBytes(16).toString('hex')}.${formato}`;
  await writeFile(join(pasta, nome), bytes);

  return urlDaCapa(nome);
}
