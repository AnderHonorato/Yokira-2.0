// Arquivo: src/lib/servidor/banco/plano-do-lote.ts
// Monta a lista de episodios que o lote vai criar, antes de tocar no banco. Separado
// de proposito: numeracao e datas de estreia sao o que erra em silencio, e conferir
// isso contra o banco depois de criado custa caro.

export type IntervaloDeEstreia = 'nenhum' | 'diario' | 'semanal';

const DIAS_POR_INTERVALO: Record<IntervaloDeEstreia, number> = {
  nenhum: 0,
  diario: 1,
  semanal: 7
};

export interface ItemDoLote {
  numero: number;
  nome: string;
  publicadoEm?: Date;
  link?: string;
}

export interface OpcoesDoLote {
  numeroInicial: number;
  /** Usada quando nao ha links: cria N episodios numerados. */
  quantidade: number;
  links: string[];
  primeiraEstreia?: Date;
  intervalo: IntervaloDeEstreia;
}

/** Uma linha por link, sem espaco nem linha vazia. */
export function separarLinks(texto: string): string[] {
  return texto
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter((linha) => linha !== '');
}

/**
 * Data de estreia do item na posicao dada. Soma em DIAS pelo calendario local, nao
 * em milissegundos: somar 7*24h atravessa horario de verao e a estreia semanal
 * escorregaria uma hora.
 */
export function estreiaNaPosicao(
  primeira: Date,
  intervalo: IntervaloDeEstreia,
  posicao: number
): Date {
  const dias = DIAS_POR_INTERVALO[intervalo] * posicao;
  const data = new Date(primeira);
  data.setDate(data.getDate() + dias);
  return data;
}

export function montarPlano(opcoes: OpcoesDoLote): ItemDoLote[] {
  // Com links, quem manda na quantidade e a lista: um episodio por linha.
  const total = opcoes.links.length > 0 ? opcoes.links.length : Math.max(0, opcoes.quantidade);

  const itens: ItemDoLote[] = [];
  for (let posicao = 0; posicao < total; posicao += 1) {
    const numero = opcoes.numeroInicial + posicao;
    itens.push({
      numero,
      nome: `Episódio ${numero}`,
      publicadoEm: opcoes.primeiraEstreia
        ? estreiaNaPosicao(opcoes.primeiraEstreia, opcoes.intervalo, posicao)
        : undefined,
      link: opcoes.links[posicao]
    });
  }

  return itens;
}
