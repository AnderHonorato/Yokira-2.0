// Arquivo: testes/unitarios/plano-do-lote.teste.ts
// Numeracao e datas do lote. Um erro aqui cria doze episodios errados de uma vez, e
// o conserto e apagar tudo e refazer — vale conferir antes de tocar no banco.

import { describe, expect, it } from 'vitest';
import {
  estreiaNaPosicao,
  montarPlano,
  separarLinks
} from '../../src/lib/servidor/banco/plano-do-lote';

describe('separarLinks', () => {
  it('uma linha por link, sem vazio nem espaco sobrando', () => {
    const texto = ' https://a/1.mp4 \n\nhttps://a/2.mp4\r\n   \nhttps://a/3.mp4';
    expect(separarLinks(texto)).toEqual(['https://a/1.mp4', 'https://a/2.mp4', 'https://a/3.mp4']);
  });

  it('texto vazio nao vira um item em branco', () => {
    expect(separarLinks('')).toEqual([]);
    expect(separarLinks('   \n  \n')).toEqual([]);
  });
});

describe('estreiaNaPosicao', () => {
  it('semanal anda de sete em sete dias', () => {
    const primeira = new Date(2026, 8, 1, 20, 0);
    expect(estreiaNaPosicao(primeira, 'semanal', 0).getDate()).toBe(1);
    expect(estreiaNaPosicao(primeira, 'semanal', 1).getDate()).toBe(8);
    expect(estreiaNaPosicao(primeira, 'semanal', 3).getDate()).toBe(22);
  });

  it('sem intervalo, todos estreiam junto', () => {
    const primeira = new Date(2026, 8, 1, 20, 0);
    expect(estreiaNaPosicao(primeira, 'nenhum', 5).getTime()).toBe(primeira.getTime());
  });

  it('atravessa a virada do mes sem inventar dia 32', () => {
    const primeira = new Date(2026, 8, 28, 20, 0); // 28 de setembro
    const quarta = estreiaNaPosicao(primeira, 'semanal', 1);
    expect(quarta.getMonth()).toBe(9); // outubro
    expect(quarta.getDate()).toBe(5);
  });

  it('mantem a hora ao somar dias pelo calendario', () => {
    // Somar 7*24h em milissegundos escorregaria uma hora no horario de verao.
    const primeira = new Date(2026, 9, 15, 20, 30);
    const depois = estreiaNaPosicao(primeira, 'semanal', 4);
    expect(depois.getHours()).toBe(20);
    expect(depois.getMinutes()).toBe(30);
  });
});

describe('montarPlano', () => {
  it('cria N episodios numerados a partir do inicial', () => {
    const plano = montarPlano({
      numeroInicial: 5,
      quantidade: 3,
      links: [],
      intervalo: 'nenhum'
    });
    expect(plano.map((i) => i.numero)).toEqual([5, 6, 7]);
    expect(plano.map((i) => i.nome)).toEqual(['Episódio 5', 'Episódio 6', 'Episódio 7']);
    expect(plano.every((i) => i.publicadoEm === undefined)).toBe(true);
  });

  it('com links, a lista manda na quantidade', () => {
    const plano = montarPlano({
      numeroInicial: 1,
      quantidade: 99,
      links: ['https://a/1.mp4', 'https://a/2.mp4'],
      intervalo: 'nenhum'
    });
    expect(plano).toHaveLength(2);
    expect(plano[1].link).toBe('https://a/2.mp4');
  });

  it('agenda em serie a partir da primeira estreia', () => {
    const plano = montarPlano({
      numeroInicial: 1,
      quantidade: 3,
      links: [],
      primeiraEstreia: new Date(2026, 8, 1, 20, 0),
      intervalo: 'semanal'
    });
    expect(plano.map((i) => i.publicadoEm!.getDate())).toEqual([1, 8, 15]);
  });

  it('quantidade zero ou negativa nao cria nada', () => {
    for (const quantidade of [0, -3]) {
      expect(montarPlano({ numeroInicial: 1, quantidade, links: [], intervalo: 'nenhum' })).toEqual(
        []
      );
    }
  });
});
