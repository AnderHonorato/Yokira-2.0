// Arquivo: src/lib/servidor/midia/faixa-bytes.ts
// Interpreta o cabecalho Range. O player pede pedaco quando o usuario arrasta a barra;
// sem isso cada pulo baixaria o segmento inteiro de novo.
//
// Faixa que nao faz sentido devolve null e o chamador manda o arquivo inteiro, que e o
// comportamento seguro: melhor mandar demais do que mandar bytes de outro lugar.

export interface FaixaDeBytes {
  inicio: number;
  fim: number;
}

const FAIXA = /^bytes=(\d*)-(\d*)$/;

export function interpretarFaixa(cabecalho: string | null, tamanho: number): FaixaDeBytes | null {
  if (!cabecalho || tamanho <= 0) return null;

  const casou = FAIXA.exec(cabecalho.trim());
  if (!casou) return null;

  const [, cruInicio, cruFim] = casou;
  if (cruInicio === '' && cruFim === '') return null;

  let inicio: number;
  let fim: number;

  if (cruInicio === '') {
    // Sufixo "bytes=-N": os ultimos N bytes do arquivo.
    const ultimos = Number(cruFim);
    if (ultimos <= 0) return null;
    inicio = Math.max(0, tamanho - ultimos);
    fim = tamanho - 1;
  } else {
    inicio = Number(cruInicio);
    fim = cruFim === '' ? tamanho - 1 : Math.min(Number(cruFim), tamanho - 1);
  }

  if (!Number.isFinite(inicio) || !Number.isFinite(fim)) return null;
  if (inicio > fim || inicio >= tamanho) return null;

  return { inicio, fim };
}
