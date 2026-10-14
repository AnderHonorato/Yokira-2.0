// Arquivo: testes/unitarios/capas.teste.ts
// Capa vinda de fora. O risco aqui nao e a imagem feia: e um arquivo chamado .png com
// outra coisa dentro, que voltaria depois servido pela nossa propria origem.

import { describe, expect, it } from 'vitest';
import {
  formatoDaImagem,
  nomeDeCapaValido,
  TIPO_POR_FORMATO
} from '../../src/lib/servidor/midia/imagens';
import { argumentosDoQuadro, segundoValido } from '../../src/lib/servidor/midia/quadro-de-video';
import { urlDaCapa } from '../../src/lib/servidor/midia/capas';

const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const webp = Buffer.concat([
  Buffer.from('RIFF'),
  Buffer.from([0x24, 0x00, 0x00, 0x00]),
  Buffer.from('WEBP'),
  Buffer.from('VP8 ')
]);

describe('formatoDaImagem', () => {
  it('reconhece os tres formatos aceitos pelos bytes', () => {
    expect(formatoDaImagem(jpeg)).toBe('jpg');
    expect(formatoDaImagem(png)).toBe('png');
    expect(formatoDaImagem(webp)).toBe('webp');
  });

  it('recusa o que nao e imagem, por mais que o nome diga que e', () => {
    expect(formatoDaImagem(Buffer.from('<html><script>alert(1)</script>'))).toBeNull();
    expect(formatoDaImagem(Buffer.from('GIF89a'))).toBeNull();
    expect(formatoDaImagem(Buffer.from([]))).toBeNull();
    // RIFF sem WEBP e outro contêiner (wav, avi), nao imagem.
    expect(formatoDaImagem(Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(8)]))).toBeNull();
  });

  it('nao estoura em buffer curto demais pra assinatura', () => {
    expect(formatoDaImagem(Buffer.from([0xff]))).toBeNull();
    expect(formatoDaImagem(Buffer.from([0x89, 0x50]))).toBeNull();
  });
});

describe('nomeDeCapaValido', () => {
  it('aceita so o nome sorteado que a gravacao gera', () => {
    expect(nomeDeCapaValido('a'.repeat(32) + '.jpg')).toBe(true);
    expect(nomeDeCapaValido('0123456789abcdef0123456789abcdef.webp')).toBe(true);
  });

  it('barra travessia de caminho e nome inventado', () => {
    for (const ruim of [
      '../../.env',
      'a'.repeat(32) + '.svg',
      'a'.repeat(31) + '.jpg',
      'MAIUSCULA0123456789abcdef012345.jpg',
      ''
    ]) {
      expect(nomeDeCapaValido(ruim), ruim).toBe(false);
    }
  });
});

describe('TIPO_POR_FORMATO', () => {
  it('cobre todo formato que a deteccao devolve', () => {
    for (const formato of ['jpg', 'png', 'webp'] as const) {
      expect(TIPO_POR_FORMATO[formato]).toMatch(/^image\//);
    }
  });
});

describe('urlDaCapa', () => {
  it('devolve o caminho publico, nao o de disco', () => {
    expect(urlDaCapa('abc.jpg')).toBe('/midia/capa/abc.jpg');
  });
});

describe('segundoValido', () => {
  it('prende o segundo em algo que faz sentido', () => {
    expect(segundoValido(12.345)).toBe(12.35);
    expect(segundoValido(-5)).toBe(0);
    expect(segundoValido('abc')).toBe(0);
    expect(segundoValido(999_999)).toBe(86_400);
  });
});

describe('argumentosDoQuadro', () => {
  it('poe o -ss ANTES do -i, senao o ffmpeg decodifica o video inteiro', () => {
    const argumentos = argumentosDoQuadro('/midia/originais/x.mp4', 30);
    expect(argumentos.indexOf('-ss')).toBeLessThan(argumentos.indexOf('-i'));
    expect(argumentos).toContain('/midia/originais/x.mp4');
    expect(argumentos.at(-1)).toBe('pipe:1');
  });
});
