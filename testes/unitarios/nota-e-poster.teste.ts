// Arquivo: testes/unitarios/nota-e-poster.teste.ts

import { describe, expect, it } from 'vitest';
import { calcularNota, paraCartao } from '../../src/lib/servidor/banco/mapear-titulo';
import { paletaDo, posterEmDataUri, semear } from '../../src/lib/visual/posters/gerar-poster';

describe('calcularNota', () => {
  it('sem avaliacao devolve null, nao zero', () => {
    expect(calcularNota([])).toBeNull();
  });

  it('arredonda pra uma casa decimal', () => {
    expect(calcularNota([{ nota: 8 }, { nota: 9 }, { nota: 9 }])).toBe(8.7);
  });
});

const BRUTO = {
  id: 'a1',
  slug: 'lamina-do-crepusculo',
  nome: 'Lâmina do Crepúsculo',
  sinopse: 'Uma sinopse qualquer para o teste.',
  ano: 2021,
  classificacao: '16',
  novidade: true,
  posterUrl: null,
  arteHeroUrl: null,
  temporadas: [{ numero: 1 }, { numero: 2 }],
  generos: [{ genero: { nome: 'Ação' } }],
  avaliacoes: [{ nota: 9 }]
};

describe('paraCartao', () => {
  it('novidade vira "2ª Temporada" na segunda linha', () => {
    expect(paraCartao(BRUTO).rotuloSecundario).toBe('2ª Temporada');
  });

  it('titulo comum mantem "Legendas Br"', () => {
    expect(paraCartao({ ...BRUTO, novidade: false }).rotuloSecundario).toBe('Legendas Br');
  });

  it('gera poster proprio quando nao ha arte cadastrada', () => {
    expect(paraCartao(BRUTO).poster.startsWith('data:image/svg+xml')).toBe(true);
  });
});

describe('poster procedural', () => {
  it('e deterministico: o mesmo slug gera sempre o mesmo poster', () => {
    expect(posterEmDataUri('teste', 'Teste')).toBe(posterEmDataUri('teste', 'Teste'));
    expect(semear('a')).not.toBe(semear('b'));
  });

  it('sempre escolhe uma paleta valida', () => {
    expect(paletaDo('qualquer-coisa')).toHaveLength(3);
  });
});
