// Arquivo: testes/unitarios/estreia.teste.ts
// Agendamento de estreia. O que quebra silencioso aqui e o fuso: uma data lida como
// UTC desloca a estreia em horas, e ninguem percebe ate o episodio aparecer cedo.

import { describe, expect, it } from 'vitest';
import { estreou, jaEstreou, podeVerAntesDaEstreia } from '../../src/lib/servidor/banco/estreia';
import {
  agendado,
  paraCampoLocal,
  rotuloDeEstreia
} from '../../src/lib/componentes/admin/estreia-no-formulario';
import { validarDataDeEstreia } from '../../src/lib/validacoes/administracao';
import { ErroDeValidacao } from '../../src/lib/validacoes/erro-validacao';

const AGORA = new Date('2026-09-01T12:00:00');

describe('estreou', () => {
  it('conta como no ar o episodio publicado no passado e no instante exato', () => {
    expect(estreou(new Date('2026-08-31T12:00:00'), AGORA)).toBe(true);
    expect(estreou(new Date(AGORA), AGORA)).toBe(true);
  });

  it('segura o episodio com data no futuro', () => {
    expect(estreou(new Date('2026-09-01T12:00:01'), AGORA)).toBe(false);
  });
});

describe('jaEstreou', () => {
  it('devolve a condicao do Prisma amarrada ao instante recebido', () => {
    expect(jaEstreou(AGORA)).toEqual({ publicadoEm: { lte: AGORA } });
  });
});

describe('podeVerAntesDaEstreia', () => {
  it('libera quem edita e barra quem so assiste', () => {
    for (const papel of ['EDITOR', 'MODERADOR', 'ADMINISTRADOR']) {
      expect(podeVerAntesDaEstreia(papel)).toBe(true);
    }
    expect(podeVerAntesDaEstreia('ESPECTADOR')).toBe(false);
    expect(podeVerAntesDaEstreia(undefined)).toBe(false);
  });
});

describe('validarDataDeEstreia', () => {
  it('campo vazio significa "no ar agora": deixa o banco por now()', () => {
    expect(validarDataDeEstreia('')).toBeUndefined();
    expect(validarDataDeEstreia('   ')).toBeUndefined();
    expect(validarDataDeEstreia(null)).toBeUndefined();
    expect(validarDataDeEstreia(undefined)).toBeUndefined();
  });

  it('le o valor do datetime-local como hora LOCAL, nao UTC', () => {
    const data = validarDataDeEstreia('2026-09-01T20:00');
    expect(data).toBeInstanceOf(Date);
    // Se fosse lido como UTC, getHours() aqui devolveria outra coisa que nao 20.
    expect(data!.getHours()).toBe(20);
    expect(data!.getDate()).toBe(1);
  });

  it('recusa texto que nao e data', () => {
    expect(() => validarDataDeEstreia('amanha de manha')).toThrow(ErroDeValidacao);
  });
});

describe('paraCampoLocal', () => {
  it('devolve o formato que o input aceita, preenchendo com zero', () => {
    expect(paraCampoLocal(new Date(2026, 8, 1, 20, 5))).toBe('2026-09-01T20:05');
    expect(paraCampoLocal(new Date(2026, 0, 9, 7, 0))).toBe('2026-01-09T07:00');
  });

  it('sobrevive a ida e volta sem deslocar a hora', () => {
    const original = new Date(2026, 11, 31, 23, 59);
    const devolta = validarDataDeEstreia(paraCampoLocal(original));
    expect(devolta!.getTime()).toBe(original.getTime());
  });
});

describe('agendado', () => {
  it('so e agendado enquanto a data nao chegou', () => {
    expect(agendado(new Date('2026-09-02T00:00:00'), AGORA)).toBe(true);
    expect(agendado(new Date('2026-08-30T00:00:00'), AGORA)).toBe(false);
  });
});

describe('rotuloDeEstreia', () => {
  it('mostra dia e hora, sem virar texto vazio', () => {
    const rotulo = rotuloDeEstreia(new Date(2026, 8, 1, 20, 0));
    expect(rotulo).toContain('01/09/2026');
    expect(rotulo).toContain('20:00');
  });
});
