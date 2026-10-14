// Arquivo: testes/unitarios/tema.teste.ts
// Preferencia de tema: o que o servidor aceita e a cor da barra do navegador.

import { describe, expect, it } from 'vitest';
import { metaDeTema, normalizarTema, TEMAS, TEMA_PADRAO } from '../../src/lib/validacoes/tema';

describe('normalizarTema', () => {
  it('aceita as tres opcoes', () => {
    for (const tema of TEMAS) expect(normalizarTema(tema)).toBe(tema);
  });

  it('cai no escuro para qualquer lixo — cookie e entrada de fora', () => {
    for (const ruim of [undefined, null, '', 'roxo', 'dark', 42, {}, '<script>']) {
      expect(normalizarTema(ruim)).toBe(TEMA_PADRAO);
    }
  });

  it('o padrao e o escuro, que e como a marca se apresenta', () => {
    expect(TEMA_PADRAO).toBe('escuro');
  });
});

describe('metaDeTema', () => {
  it('escolha explicita sai com uma cor so, sem media query', () => {
    expect(metaDeTema('escuro')).toBe('<meta name="theme-color" content="#08080b" />');
    expect(metaDeTema('claro')).toBe('<meta name="theme-color" content="#f4f4f7" />');
  });

  it('no automatico saem as duas, cada uma com sua media query', () => {
    const marcacao = metaDeTema('automatico');
    expect(marcacao).toContain('prefers-color-scheme: dark');
    expect(marcacao).toContain('prefers-color-scheme: light');
    expect(marcacao).toContain('#08080b');
    expect(marcacao).toContain('#f4f4f7');
  });

  it('nao devolve aspas soltas que quebrariam o HTML', () => {
    for (const tema of TEMAS) {
      const marcacao = metaDeTema(tema);
      expect(marcacao.split('"').length % 2).toBe(1);
    }
  });
});
