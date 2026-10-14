// Arquivo: src/lib/servidor/armazenamento/baixar-de-url.ts
// Traz um video de um link. Quem abre a conexao e o SERVIDOR, entao cada endereco e
// conferido antes: esquema, IP resolvido e tamanho. O redirecionamento e seguido a mao
// justamente pra reconferir cada salto — um destino publico pode redirecionar pra
// 169.254.169.254 e a checagem so na primeira URL nao veria nada.

import { lookup } from 'node:dns/promises';
import { extensaoAceita, TAMANHO_MAXIMO_BYTES } from './gravar-upload.js';
import { enderecoPrivado } from './endereco-privado.js';

export const MAXIMO_DE_SALTOS = 3;

export class ErroDeDownload extends Error {}

/** Confere esquema e para onde o nome de verdade aponta. */
export async function conferirEndereco(bruto: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(bruto);
  } catch {
    throw new ErroDeDownload('Link inválido.');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new ErroDeDownload('Só aceitamos links http e https.');
  }

  // `all: true` porque um nome pode devolver varios IPs: basta um interno pra recusar.
  const resolvidos = await lookup(url.hostname, { all: true }).catch(() => {
    throw new ErroDeDownload('Não consegui resolver o endereço do link.');
  });

  if (resolvidos.length === 0 || resolvidos.some((item) => enderecoPrivado(item.address))) {
    throw new ErroDeDownload('Esse link aponta para um endereço de rede interna.');
  }

  return url;
}

/** Nome de arquivo do link, pra decidir a extensao. */
export function nomeDoLink(url: URL): string {
  const ultimo = url.pathname.split('/').filter(Boolean).pop() ?? '';
  return decodeURIComponent(ultimo);
}

async function seguir(bruto: string, saltos = 0): Promise<Response> {
  if (saltos > MAXIMO_DE_SALTOS) throw new ErroDeDownload('O link redireciona demais.');

  const url = await conferirEndereco(bruto);
  const resposta = await fetch(url, { redirect: 'manual' });

  if (resposta.status >= 300 && resposta.status < 400) {
    const destino = resposta.headers.get('location');
    if (!destino) throw new ErroDeDownload('Redirecionamento sem destino.');
    return seguir(new URL(destino, url).toString(), saltos + 1);
  }

  if (!resposta.ok) throw new ErroDeDownload(`O link respondeu ${resposta.status}.`);
  return resposta;
}

export interface VideoBaixado {
  bytes: Buffer;
  nome: string;
}

export async function baixarVideo(bruto: string): Promise<VideoBaixado> {
  const resposta = await seguir(bruto);

  // O content-length e uma dica, nao uma garantia: cortamos de novo pelo tamanho real.
  const anunciado = Number(resposta.headers.get('content-length') ?? '0');
  if (anunciado > TAMANHO_MAXIMO_BYTES) {
    throw new ErroDeDownload('O arquivo do link está acima do limite.');
  }

  const bytes = Buffer.from(await resposta.arrayBuffer());
  if (bytes.length === 0) throw new ErroDeDownload('O link não devolveu nenhum conteúdo.');
  if (bytes.length > TAMANHO_MAXIMO_BYTES) {
    throw new ErroDeDownload('O arquivo do link está acima do limite.');
  }

  const nome = nomeDoLink(new URL(resposta.url || bruto));
  if (!extensaoAceita(nome)) {
    throw new ErroDeDownload('O link não termina em mp4, mkv, mov ou webm.');
  }

  return { bytes, nome };
}
