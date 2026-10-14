// Arquivo: testes/unitarios/validacoes-e-permissoes.teste.ts

import { describe, expect, it } from 'vitest';
import { validarEmail, validarNome, validarSenha } from '../../src/lib/validacoes/conta';
import { ErroDeValidacao } from '../../src/lib/validacoes/erro-validacao';
import { validarProgresso } from '../../src/lib/validacoes/lista';
import { temPapelMinimo } from '../../src/lib/servidor/permissoes/papeis';
import {
  argumentosDaVariante,
  PERFIS,
  playlistMestre
} from '../../src/lib/servidor/processamento/perfis-hls';
import { extensaoAceita } from '../../src/lib/servidor/armazenamento/gravar-upload';

describe('validacao de conta', () => {
  it('normaliza o e-mail pra minusculo', () => {
    expect(validarEmail('  Ander@Yokira.LOCAL ')).toBe('ander@yokira.local');
  });

  it('recusa e-mail sem formato', () => {
    expect(() => validarEmail('ander@')).toThrow(ErroDeValidacao);
  });

  it('exige senha longa com letra e numero', () => {
    expect(() => validarSenha('curta1')).toThrow(ErroDeValidacao);
    expect(() => validarSenha('somenteletras')).toThrow(ErroDeValidacao);
    expect(validarSenha('YokiraDemo2024')).toBe('YokiraDemo2024');
  });

  it('recusa nome de uma letra', () => {
    expect(() => validarNome('A')).toThrow(ErroDeValidacao);
  });
});

describe('validacao de progresso', () => {
  it('recusa segundos negativos e absurdos', () => {
    expect(() => validarProgresso({ episodioId: 'a', segundos: -1 })).toThrow(ErroDeValidacao);
    expect(() => validarProgresso({ episodioId: 'a', segundos: 999_999 })).toThrow(ErroDeValidacao);
  });

  it('aceita valor plausivel', () => {
    expect(validarProgresso({ episodioId: 'a', segundos: 900 })).toEqual({
      episodioId: 'a',
      segundos: 900
    });
  });
});

describe('hierarquia de papeis', () => {
  it('espectador nao alcanca o painel', () => {
    expect(temPapelMinimo('ESPECTADOR', 'EDITOR')).toBe(false);
    expect(temPapelMinimo(undefined, 'EDITOR')).toBe(false);
  });

  it('administrador alcanca tudo', () => {
    expect(temPapelMinimo('ADMINISTRADOR', 'EDITOR')).toBe(true);
    expect(temPapelMinimo('ADMINISTRADOR', 'MODERADOR')).toBe(true);
  });
});

describe('pipeline de video', () => {
  it('gera tres degraus de qualidade', () => {
    expect(PERFIS.map((p) => p.altura)).toEqual([360, 720, 1080]);
  });

  it('a playlist mestre aponta pras variantes', () => {
    const mestre = playlistMestre(PERFIS);
    expect(mestre).toContain('#EXTM3U');
    expect(mestre).toContain('720p.m3u8');
  });

  it('os argumentos do ffmpeg escalam mantendo a proporcao', () => {
    const argumentos = argumentosDaVariante('entrada.mp4', '/saida', PERFIS[0]);
    expect(argumentos).toContain('scale=-2:360');
    expect(argumentos).toContain('/saida/360p.m3u8');
  });

  it('so aceita extensoes de video conhecidas', () => {
    expect(extensaoAceita('episodio.MP4')).toBe(true);
    expect(extensaoAceita('episodio.mkv')).toBe(true);
    expect(extensaoAceita('malicioso.exe')).toBe(false);
  });
});
