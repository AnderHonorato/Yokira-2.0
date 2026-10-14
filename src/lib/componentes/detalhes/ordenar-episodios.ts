// Arquivo: src/lib/componentes/detalhes/ordenar-episodios.ts
// Ordenacao fora do componente porque e a unica logica de verdade da lista — e da pra testar.

export type Ordem = 'crescente' | 'decrescente';

export interface EpisodioOrdenavel {
  numero: number;
}

export function ordenarEpisodios<T extends EpisodioOrdenavel>(episodios: T[], ordem: Ordem): T[] {
  // Copia antes de ordenar: sort() no array original bagunca o que veio do servidor.
  const copia = [...episodios];
  copia.sort((a, b) => (ordem === 'crescente' ? a.numero - b.numero : b.numero - a.numero));
  return copia;
}
