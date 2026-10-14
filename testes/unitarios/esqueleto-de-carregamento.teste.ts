// Arquivo: testes/unitarios/esqueleto-de-carregamento.teste.ts
// Cobre as duas decisoes do esqueleto: QUAL estrutura a rota pede e QUANDO ela entra.
// O componente em si nao entra aqui — o que quebra silencioso e o mapeamento e o relogio.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { get, writable } from 'svelte/store';
import { esqueletoDaRota, repetir } from '../../src/lib/componentes/carregando/esqueleto-de-rota';
import {
  criarEsperaDeNavegacao,
  type NavegacaoEmCurso
} from '../../src/lib/cliente/espera-de-navegacao';

function navegacaoPara(caminho: string): NavegacaoEmCurso {
  return { to: { url: { pathname: caminho } } };
}

describe('esqueletoDaRota', () => {
  it('devolve a home so na raiz exata', () => {
    expect(esqueletoDaRota('/')).toBe('home');
  });

  it('trata titulo e assistir pelas estruturas proprias', () => {
    expect(esqueletoDaRota('/titulo/naruto')).toBe('detalhes');
    expect(esqueletoDaRota('/assistir/abc123')).toBe('player');
  });

  it('cobre o painel e suas subrotas', () => {
    expect(esqueletoDaRota('/admin')).toBe('painel');
    expect(esqueletoDaRota('/admin/titulos/42')).toBe('painel');
  });

  it('agrupa as rotas que desenham grade de cards', () => {
    for (const rota of ['/catalogo', '/novidades', '/generos', '/minha-lista', '/buscar']) {
      expect(esqueletoDaRota(rota)).toBe('grade');
    }
    expect(esqueletoDaRota('/catalogo?genero=acao')).toBe('generico');
  });

  it('cai no generico no que sobra', () => {
    expect(esqueletoDaRota('/entrar')).toBe('generico');
    expect(esqueletoDaRota('/configuracoes')).toBe('generico');
  });

  it('nao confunde prefixo com subrota', () => {
    // "/administracao" comeca com "/admin" mas nao e o painel.
    expect(esqueletoDaRota('/administracao')).toBe('generico');
  });
});

describe('repetir', () => {
  it('devolve indices contiguos e nada quando nao ha o que repetir', () => {
    expect(repetir(3)).toEqual([0, 1, 2]);
    expect(repetir(0)).toEqual([]);
  });
});

describe('criarEsperaDeNavegacao', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('nao acende antes do limiar', () => {
    const origem = writable<NavegacaoEmCurso | null>(null);
    const espera = criarEsperaDeNavegacao(origem, 140);
    const parar = espera.subscribe(() => {});

    origem.set(navegacaoPara('/catalogo'));
    vi.advanceTimersByTime(139);
    expect(get(espera)).toBeNull();

    vi.advanceTimersByTime(1);
    expect(get(espera)).toBe('/catalogo');
    parar();
  });

  it('navegacao rapida nao pisca esqueleto', () => {
    const origem = writable<NavegacaoEmCurso | null>(null);
    const espera = criarEsperaDeNavegacao(origem, 140);
    const parar = espera.subscribe(() => {});

    origem.set(navegacaoPara('/catalogo'));
    vi.advanceTimersByTime(40);
    origem.set(null);
    vi.advanceTimersByTime(500);

    expect(get(espera)).toBeNull();
    parar();
  });

  it('navegacao encadeada reinicia a contagem em vez de herdar o relogio', () => {
    const origem = writable<NavegacaoEmCurso | null>(null);
    const espera = criarEsperaDeNavegacao(origem, 140);
    const parar = espera.subscribe(() => {});

    origem.set(navegacaoPara('/catalogo'));
    vi.advanceTimersByTime(120);
    origem.set(navegacaoPara('/novidades'));
    vi.advanceTimersByTime(120);
    expect(get(espera)).toBeNull();

    vi.advanceTimersByTime(20);
    expect(get(espera)).toBe('/novidades');
    parar();
  });

  it('some assim que a navegacao termina', () => {
    const origem = writable<NavegacaoEmCurso | null>(null);
    const espera = criarEsperaDeNavegacao(origem, 140);
    const parar = espera.subscribe(() => {});

    origem.set(navegacaoPara('/titulo/naruto'));
    vi.advanceTimersByTime(200);
    expect(get(espera)).toBe('/titulo/naruto');

    origem.set(null);
    expect(get(espera)).toBeNull();
    parar();
  });
});
