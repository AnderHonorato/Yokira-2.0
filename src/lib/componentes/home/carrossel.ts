// Arquivo: src/lib/componentes/home/carrossel.ts
// Calculo de deslocamento da trilha. Deixei fora do .svelte pra conseguir testar sem montar componente.

export interface EstadoCarrossel {
  podeVoltar: boolean;
  podeAvancar: boolean;
}

export function medirEstado(trilha: HTMLElement): EstadoCarrossel {
  const fim = trilha.scrollWidth - trilha.clientWidth;
  return {
    podeVoltar: trilha.scrollLeft > 4,
    // Conteudo que cabe inteiro na tela nao tem "avancar" — e assim que as setas somem.
    podeAvancar: fim > 4 && trilha.scrollLeft < fim - 4
  };
}

export function deslocar(trilha: HTMLElement, direcao: 1 | -1): void {
  // Ando quase uma tela cheia, mas deixo um card aparecendo pra dar continuidade visual.
  const passo = trilha.clientWidth * 0.85;
  trilha.scrollBy({ left: passo * direcao, behavior: 'smooth' });
}

/** Navegacao por teclado dentro da trilha: seta move o foco pro card vizinho. */
export function indiceVizinho(indiceAtual: number, direcao: 1 | -1, total: number): number {
  const proximo = indiceAtual + direcao;
  if (proximo < 0) return 0;
  if (proximo > total - 1) return total - 1;
  return proximo;
}
