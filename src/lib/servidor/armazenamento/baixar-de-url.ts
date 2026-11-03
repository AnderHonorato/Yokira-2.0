// Importa vídeo remoto sem expor a rede interna a URLs controladas pelo usuário.
// Cada redirecionamento resolve o DNS uma vez e conecta no IP público já validado.

import { lookup } from 'node:dns/promises';
import { request as requisicaoHttp, type IncomingMessage } from 'node:http';
import { request as requisicaoHttps, type RequestOptions } from 'node:https';
import { isIP } from 'node:net';
import { Readable } from 'node:stream';
import { extensaoAceita, TAMANHO_MAXIMO_BYTES } from './gravar-upload.js';
import { enderecoPrivado } from './endereco-privado.js';

export const MAXIMO_DE_SALTOS = 3;
const TEMPO_MAXIMO_MS = 15 * 60 * 1000;

export class ErroDeDownload extends Error {}

interface EnderecoResolvido {
  address: string;
  family: number;
}

function validarUrl(bruto: string): URL {
  let url: URL;
  try {
    url = new URL(bruto);
  } catch {
    throw new ErroDeDownload('Link inválido.');
  }
  if (!['http:', 'https:'].includes(url.protocol))
    throw new ErroDeDownload('Só aceitamos links http e https.');
  if (url.username || url.password)
    throw new ErroDeDownload('Links com credenciais não são aceitos.');
  if (url.port && !['80', '443'].includes(url.port))
    throw new ErroDeDownload('O link precisa usar uma porta HTTP ou HTTPS padrão.');
  return url;
}

/** A presença de um único destino privado invalida toda a resposta DNS. */
export function escolherEnderecoPublico(enderecos: EnderecoResolvido[]): EnderecoResolvido {
  if (
    enderecos.length === 0 ||
    enderecos.some(
      ({ address, family }) => isIP(address) !== family || enderecoPrivado(address)
    )
  ) {
    throw new ErroDeDownload('Esse link aponta para um endereço de rede interna ou inválido.');
  }
  return enderecos[0];
}

async function resolverDestino(bruto: string) {
  const url = validarUrl(bruto);
  const nome = url.hostname.replace(/^\[|\]$/g, '');
  const resolvidos = await lookup(nome, { all: true }).catch(() => {
    throw new ErroDeDownload('Não consegui resolver o endereço do link.');
  });
  return { url, endereco: escolherEnderecoPublico(resolvidos) };
}

/** Conserva o Host e SNI originais, mas força a conexão ao IP validado. */
export function opcoesDeConexao(
  url: URL,
  endereco: EnderecoResolvido,
  signal?: AbortSignal
): RequestOptions {
  const nomeOriginal = url.hostname.replace(/^\[|\]$/g, '');
  return {
    hostname: endereco.address,
    port: url.port ? Number(url.port) : url.protocol === 'https:' ? 443 : 80,
    path: url.pathname + url.search,
    method: 'GET',
    agent: false,
    headers: { host: url.host, 'accept-encoding': 'identity' },
    servername: isIP(nomeOriginal) ? undefined : nomeOriginal,
    signal
  };
}

export async function conferirEndereco(bruto: string): Promise<URL> {
  return (await resolverDestino(bruto)).url;
}

export function nomeDoLink(url: URL): string {
  const ultimo = url.pathname.split('/').filter(Boolean).pop() ?? '';
  try {
    return decodeURIComponent(ultimo);
  } catch {
    throw new ErroDeDownload('O nome do arquivo no link é inválido.');
  }
}

function solicitar(
  url: URL,
  endereco: EnderecoResolvido,
  signal: AbortSignal
): Promise<IncomingMessage> {
  return new Promise((resolver, rejeitar) => {
    const metodo = url.protocol === 'https:' ? requisicaoHttps : requisicaoHttp;
    const pedido = metodo(opcoesDeConexao(url, endereco, signal), resolver);
    pedido.once('error', rejeitar);
    pedido.end();
  });
}

async function seguir(
  bruto: string,
  sinal: AbortSignal,
  saltos = 0
): Promise<{ resposta: IncomingMessage; url: URL }> {
  if (saltos > MAXIMO_DE_SALTOS)
    throw new ErroDeDownload('O link redireciona demais.');

  const { url, endereco } = await resolverDestino(bruto);
  let resposta: IncomingMessage;
  try {
    resposta = await solicitar(url, endereco, sinal);
  } catch {
    throw new ErroDeDownload('Não foi possível conectar ao servidor do vídeo.');
  }

  const status = resposta.statusCode ?? 0;
  if (status >= 300 && status < 400) {
    const destino = resposta.headers.location;
    resposta.destroy();
    if (!destino) throw new ErroDeDownload('Redirecionamento sem destino.');
    return seguir(new URL(destino, url).toString(), sinal, saltos + 1);
  }
  if (status < 200 || status >= 300) {
    resposta.destroy();
    throw new ErroDeDownload(`O link respondeu ${status}.`);
  }
  return { resposta, url };
}

export interface VideoBaixado {
  fluxo: ReadableStream<Uint8Array>;
  nome: string;
}

export async function baixarVideo(bruto: string): Promise<VideoBaixado> {
  // O mesmo prazo cobre os cabeçalhos e o corpo de todos os redirecionamentos.
  const sinal = AbortSignal.timeout(TEMPO_MAXIMO_MS);
  const { resposta, url } = await seguir(bruto, sinal);

  const anunciado = Number(resposta.headers['content-length'] ?? '0');
  if (!Number.isFinite(anunciado) || anunciado < 0 || anunciado > TAMANHO_MAXIMO_BYTES) {
    resposta.destroy();
    throw new ErroDeDownload('O arquivo do link está acima do limite ou tem tamanho inválido.');
  }

  let nome: string;
  try {
    nome = nomeDoLink(url);
    if (!extensaoAceita(nome))
      throw new ErroDeDownload('O link não termina em mp4, mkv, mov ou webm.');
  } catch (erro) {
    resposta.destroy();
    throw erro;
  }

  return { fluxo: Readable.toWeb(resposta) as ReadableStream<Uint8Array>, nome };
}
