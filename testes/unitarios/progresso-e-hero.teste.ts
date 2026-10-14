// Arquivo: testes/unitarios/progresso-e-hero.teste.ts

import { describe, expect, it, vi } from 'vitest';
import {
  criarAgendador,
  deveGravar,
  INTERVALO_DE_GRAVACAO_MS
} from '../../src/lib/componentes/player/progresso-periodico';
import { proximoIndice } from '../../src/lib/componentes/home/banner-destaque';
import { ordenarEpisodios } from '../../src/lib/componentes/detalhes/ordenar-episodios';
import { calcularPorcentagem } from '../../src/lib/cliente/precarregamento';
import { estaAtivo } from '../../src/lib/componentes/casca/itens-de-navegacao';

describe('gravacao de progresso', () => {
  it('so grava depois de 15s', () => {
    expect(deveGravar(0, INTERVALO_DE_GRAVACAO_MS - 1)).toBe(false);
    expect(deveGravar(0, INTERVALO_DE_GRAVACAO_MS)).toBe(true);
  });

  it('nao dispara um POST por segundo', () => {
    const enviar = vi.fn();
    let relogio = 100_000;
    const agendador = criarAgendador(enviar, () => relogio);

    for (let segundo = 1; segundo <= 10; segundo += 1) {
      relogio += 1000;
      agendador.aoAtualizarTempo(segundo);
    }
    expect(enviar).toHaveBeenCalledTimes(0);

    relogio += 6000;
    agendador.aoAtualizarTempo(16);
    expect(enviar).toHaveBeenCalledTimes(1);
    expect(enviar).toHaveBeenCalledWith(16);
  });

  it('encerrar grava o ultimo segundo conhecido', () => {
    const enviar = vi.fn();
    const agendador = criarAgendador(enviar);
    agendador.aoAtualizarTempo(42.9);
    agendador.encerrar();
    expect(enviar).toHaveBeenLastCalledWith(42);
  });
});

describe('rotacao do hero', () => {
  it('volta ao primeiro depois do ultimo', () => {
    expect(proximoIndice(0, 5)).toBe(1);
    expect(proximoIndice(4, 5)).toBe(0);
  });

  it('aguenta lista vazia sem quebrar', () => {
    expect(proximoIndice(0, 0)).toBe(0);
  });
});

describe('ordenarEpisodios', () => {
  const episodios = [{ numero: 3 }, { numero: 1 }, { numero: 2 }];

  it('nao muda o array original', () => {
    ordenarEpisodios(episodios, 'decrescente');
    expect(episodios[0].numero).toBe(3);
  });

  it('ordena nos dois sentidos', () => {
    expect(ordenarEpisodios(episodios, 'crescente').map((e) => e.numero)).toEqual([1, 2, 3]);
    expect(ordenarEpisodios(episodios, 'decrescente').map((e) => e.numero)).toEqual([3, 2, 1]);
  });
});

describe('barra de progresso do primeiro acesso', () => {
  it('mostra porcentagem real', () => {
    expect(calcularPorcentagem(0, 4)).toBe(0);
    expect(calcularPorcentagem(2, 4)).toBe(50);
    expect(calcularPorcentagem(4, 4)).toBe(100);
    expect(calcularPorcentagem(1, 0)).toBe(100);
  });
});

describe('estaAtivo', () => {
  it('a home so acende na raiz exata', () => {
    expect(estaAtivo('/', '/')).toBe(true);
    expect(estaAtivo('/catalogo', '/')).toBe(false);
  });

  it('as outras acendem nas subrotas', () => {
    expect(estaAtivo('/catalogo', '/catalogo')).toBe(true);
    expect(estaAtivo('/catalogo/acao', '/catalogo')).toBe(true);
    expect(estaAtivo('/catalogos', '/catalogo')).toBe(false);
  });
});
