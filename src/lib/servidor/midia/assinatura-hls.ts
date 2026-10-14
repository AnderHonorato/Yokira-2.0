// Arquivo: src/lib/servidor/midia/assinatura-hls.ts
// O portao da midia. Cada playlist e cada segmento so sai com uma assinatura HMAC que
// amarra tres coisas ao mesmo tempo: QUEM pediu, O QUE pediu e ATE QUANDO vale. Trocar
// qualquer uma das tres invalida o link, entao passar a URL adiante nao serve de nada.

import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Prazo do link. Precisa cobrir um episodio inteiro assistido de ponta a ponta, porque
 * os segmentos herdam o prazo da playlist que os listou.
 */
export const VALIDADE_PLAYLIST_MS = 6 * 60 * 60 * 1000;

const SEGREDO_DE_EXEMPLO = 'troque-este-valor-por-uma-string-longa-e-aleatoria';

/** Ids do banco sao cuid; a faixa aberta aqui e so pra barrar travessia de caminho. */
const IDENTIFICADOR = /^[A-Za-z0-9_-]{8,64}$/;

/** Lista fechada: exatamente os tres formatos que o ffmpeg escreve em perfis-hls.ts. */
const RECURSO = /^(mestre\.m3u8|\d{3,4}p\.m3u8|\d{3,4}p_\d{3,}\.ts)$/;

export interface RecursoAssinado {
  arquivoId: string;
  recurso: string;
  usuarioId: string;
  expiraEm: number;
}

/**
 * Segredo usado no HMAC. Em desenvolvimento cai no valor de exemplo pra suite rodar sem
 * configuracao; em producao isso vira erro, porque um segredo publico nao assina nada.
 */
export function segredoDaAssinatura(): string {
  const segredo = process.env.SEGREDO_SESSAO?.trim() || SEGREDO_DE_EXEMPLO;

  if (segredo === SEGREDO_DE_EXEMPLO && process.env.NODE_ENV === 'production') {
    throw new Error(
      'SEGREDO_SESSAO ainda e o valor de exemplo. Gere um proprio antes de servir midia.'
    );
  }

  return segredo;
}

export function identificadorValido(valor: string): boolean {
  return IDENTIFICADOR.test(valor);
}

export function recursoValido(nome: string): boolean {
  return RECURSO.test(nome);
}

export function ehPlaylist(recurso: string): boolean {
  return recurso.endsWith('.m3u8');
}

export function assinar(dados: RecursoAssinado, segredo: string = segredoDaAssinatura()): string {
  // Separador que nao aparece em nenhum dos campos: sem ele, "ab"+"c" e "a"+"bc"
  // dariam a mesma mensagem e a mesma assinatura.
  const mensagem = [dados.arquivoId, dados.recurso, dados.usuarioId, dados.expiraEm].join('\n');
  return createHmac('sha256', segredo).update(mensagem).digest('hex');
}

export function verificarAssinatura(
  dados: RecursoAssinado,
  assinatura: string,
  agora: number,
  segredo: string = segredoDaAssinatura()
): boolean {
  if (!assinatura) return false;
  if (!Number.isFinite(dados.expiraEm)) return false;
  if (agora > dados.expiraEm) return false;

  const esperada = assinar(dados, segredo);
  // O timingSafeEqual exige o mesmo tamanho; comparar antes tambem evita a excecao.
  if (esperada.length !== assinatura.length) return false;

  return timingSafeEqual(Buffer.from(esperada), Buffer.from(assinatura));
}

/** URL que o player vai pedir. E a unica forma de endereco de midia que sai do servidor. */
export function urlAssinada(
  dados: RecursoAssinado,
  segredo: string = segredoDaAssinatura()
): string {
  const parametros = new URLSearchParams({
    exp: String(dados.expiraEm),
    sig: assinar(dados, segredo)
  });

  return `/midia/hls/${dados.arquivoId}/${dados.recurso}?${parametros}`;
}
