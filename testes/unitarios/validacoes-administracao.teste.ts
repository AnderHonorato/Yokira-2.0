// Arquivo: testes/unitarios/validacoes-administracao.teste.ts
// Regras dos formularios do painel: o que o servidor aceita e o que ele recusa.

import { describe, expect, it } from 'vitest';
import {
  sugerirSlug,
  validarAno,
  validarClassificacao,
  validarDuracaoEmMinutos,
  validarNumeroDeEpisodio,
  validarNumeroDeTemporada,
  validarPapel,
  validarSinopse,
  validarSituacao,
  validarSlug
} from '../../src/lib/validacoes/administracao';

describe('sugerirSlug', () => {
  it('tira acento, caixa e pontuacao', () => {
    expect(sugerirSlug('Crepúsculo do Dragão: Ascensão')).toBe('crepusculo-do-dragao-ascensao');
  });

  it('nao deixa hifen sobrando nas pontas', () => {
    expect(sugerirSlug('  Ação!!  ')).toBe('acao');
  });

  it('corta em 80 caracteres', () => {
    expect(sugerirSlug('a'.repeat(200))).toHaveLength(80);
  });
});

describe('validarSlug', () => {
  it('aceita o formato com hifen entre palavras', () => {
    expect(validarSlug('dragao-de-prata')).toBe('dragao-de-prata');
    expect(validarSlug('TEMPORADA-2')).toBe('temporada-2');
  });

  it('recusa espaco, acento e hifen solto', () => {
    for (const ruim of [
      'com espaco',
      'acentuação',
      '-comeca-com-hifen',
      'termina-com-hifen-',
      'dois--hifens'
    ]) {
      expect(() => validarSlug(ruim)).toThrow();
    }
  });
});

describe('campos do titulo', () => {
  it('sinopse curta demais e recusada', () => {
    expect(() => validarSinopse('curta')).toThrow('curta demais');
    expect(validarSinopse('a'.repeat(25))).toHaveLength(25);
  });

  it('ano aceita ate o ano que vem, pra titulo anunciado', () => {
    const proximo = new Date().getFullYear() + 1;
    expect(validarAno(proximo)).toBe(proximo);
    expect(() => validarAno(proximo + 1)).toThrow();
    expect(() => validarAno(1800)).toThrow();
  });

  it('classificacao so da lista', () => {
    expect(validarClassificacao('16')).toBe('16');
    expect(validarClassificacao('l')).toBe('L');
    expect(() => validarClassificacao('21')).toThrow();
  });

  it('situacao so da lista', () => {
    expect(validarSituacao('publicado')).toBe('PUBLICADO');
    expect(() => validarSituacao('ARQUIVADO')).toThrow();
  });
});

describe('papel e numeracao', () => {
  it('papel so da hierarquia conhecida', () => {
    expect(validarPapel('moderador')).toBe('MODERADOR');
    expect(() => validarPapel('DONO')).toThrow();
  });

  it('temporada e episodio comecam em 1', () => {
    expect(() => validarNumeroDeTemporada(0)).toThrow();
    expect(() => validarNumeroDeEpisodio(0)).toThrow();
    expect(validarNumeroDeTemporada(1)).toBe(1);
    expect(validarNumeroDeEpisodio(9999)).toBe(9999);
  });

  it('duracao em minutos tem teto', () => {
    expect(validarDuracaoEmMinutos(24)).toBe(24);
    expect(() => validarDuracaoEmMinutos(0)).toThrow();
    expect(() => validarDuracaoEmMinutos(601)).toThrow();
  });
});
