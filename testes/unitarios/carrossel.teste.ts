// Arquivo: testes/unitarios/carrossel.teste.ts
// Cobre a regra que faz a seta sumir quando o conteudo cabe inteiro na tela.

import { describe, expect, it } from 'vitest';
import { deslocar, indiceVizinho, medirEstado } from '../../src/lib/componentes/home/carrossel';

function trilhaFalsa(scrollLeft: number, scrollWidth: number, clientWidth: number) {
  return { scrollLeft, scrollWidth, clientWidth } as unknown as HTMLElement;
}

describe('medirEstado', () => {
  it('no inicio so deixa avancar', () => {
    expect(medirEstado(trilhaFalsa(0, 2000, 500))).toEqual({
      podeVoltar: false,
      podeAvancar: true
    });
  });

  it('no fim so deixa voltar', () => {
    expect(medirEstado(trilhaFalsa(1500, 2000, 500))).toEqual({
      podeVoltar: true,
      podeAvancar: false
    });
  });

  it('conteudo que cabe na tela nao mostra nenhuma seta', () => {
    expect(medirEstado(trilhaFalsa(0, 400, 500))).toEqual({
      podeVoltar: false,
      podeAvancar: false
    });
  });
});

describe('deslocar', () => {
  it('anda 85% da largura visivel pra manter um card aparecendo', () => {
    let deslocamento = 0;
    const trilha = {
      clientWidth: 1000,
      scrollBy: (opcoes: { left: number }) => (deslocamento = opcoes.left)
    } as unknown as HTMLElement;

    deslocar(trilha, 1);
    expect(deslocamento).toBe(850);

    deslocar(trilha, -1);
    expect(deslocamento).toBe(-850);
  });
});

describe('indiceVizinho', () => {
  it('nao passa das pontas', () => {
    expect(indiceVizinho(0, -1, 5)).toBe(0);
    expect(indiceVizinho(4, 1, 5)).toBe(4);
    expect(indiceVizinho(2, 1, 5)).toBe(3);
  });
});
