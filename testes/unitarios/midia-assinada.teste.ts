// Arquivo: testes/unitarios/midia-assinada.teste.ts
// Cobre o gate da midia: assinatura amarrada a usuario/recurso/prazo, lista fechada
// de nomes de arquivo e reescrita da playlist.

import { describe, expect, it } from 'vitest';
import {
  assinar,
  ehPlaylist,
  identificadorValido,
  recursoValido,
  urlAssinada,
  verificarAssinatura
} from '../../src/lib/servidor/midia/assinatura-hls';
import { reescreverPlaylist } from '../../src/lib/servidor/midia/playlist-assinada';
import { interpretarFaixa } from '../../src/lib/servidor/midia/faixa-bytes';

const SEGREDO = 'segredo-de-teste';
const DAQUI_A_UMA_HORA = Date.now() + 3_600_000;

function recurso(troca: Partial<Parameters<typeof assinar>[0]> = {}) {
  return {
    arquivoId: 'arq123456789',
    recurso: '720p_000.ts',
    usuarioId: 'usu123456789',
    expiraEm: DAQUI_A_UMA_HORA,
    ...troca
  };
}

describe('assinatura de midia', () => {
  it('aceita a assinatura que ela mesma gerou', () => {
    const dados = recurso();
    expect(verificarAssinatura(dados, assinar(dados, SEGREDO), Date.now(), SEGREDO)).toBe(true);
  });

  it('recusa assinatura de OUTRO usuario', () => {
    const meu = recurso();
    const assinaturaDoOutro = assinar(recurso({ usuarioId: 'outro9876543' }), SEGREDO);
    expect(verificarAssinatura(meu, assinaturaDoOutro, Date.now(), SEGREDO)).toBe(false);
  });

  it('recusa assinatura de OUTRO recurso', () => {
    const meu = recurso();
    const assinaturaDeOutroArquivo = assinar(recurso({ recurso: '1080p_004.ts' }), SEGREDO);
    expect(verificarAssinatura(meu, assinaturaDeOutroArquivo, Date.now(), SEGREDO)).toBe(false);
  });

  it('recusa depois do prazo', () => {
    const dados = recurso({ expiraEm: Date.now() + 1000 });
    const assinatura = assinar(dados, SEGREDO);
    expect(verificarAssinatura(dados, assinatura, Date.now() + 2000, SEGREDO)).toBe(false);
  });

  it('recusa assinatura vazia e prazo sem numero', () => {
    expect(verificarAssinatura(recurso(), '', Date.now(), SEGREDO)).toBe(false);
    expect(verificarAssinatura(recurso({ expiraEm: Number.NaN }), 'abc', Date.now(), SEGREDO)).toBe(
      false
    );
  });

  it('recusa assinatura feita com outro segredo', () => {
    const dados = recurso();
    expect(verificarAssinatura(dados, assinar(dados, 'outro-segredo'), Date.now(), SEGREDO)).toBe(
      false
    );
  });
});

describe('nomes aceitos', () => {
  it('aceita so os tres formatos que o ffmpeg escreve', () => {
    expect(recursoValido('mestre.m3u8')).toBe(true);
    expect(recursoValido('720p.m3u8')).toBe(true);
    expect(recursoValido('1080p_012.ts')).toBe(true);
  });

  it('barra travessia de caminho e nomes inventados', () => {
    for (const ruim of [
      '../../.env',
      '..%2f..%2f.env',
      '/etc/passwd',
      'mestre.m3u8/../../segredo',
      'qualquer.txt',
      ''
    ]) {
      expect(recursoValido(ruim)).toBe(false);
    }
  });

  it('valida o identificador do arquivo', () => {
    expect(identificadorValido('arq123456789')).toBe(true);
    expect(identificadorValido('../fuga')).toBe(false);
    expect(identificadorValido('curto')).toBe(false);
  });

  it('sabe distinguir playlist de segmento', () => {
    expect(ehPlaylist('720p.m3u8')).toBe(true);
    expect(ehPlaylist('720p_000.ts')).toBe(false);
  });
});

describe('reescrever playlist', () => {
  it('assina cada segmento e preserva as tags', () => {
    const original = ['#EXTM3U', '#EXT-X-VERSION:3', '#EXTINF:6.0,', '720p_000.ts', ''].join('\n');

    const saida = reescreverPlaylist(original, (interno) =>
      urlAssinada(recurso({ recurso: interno }), SEGREDO)
    );

    const linhas = saida.split('\n');
    expect(linhas[0]).toBe('#EXTM3U');
    expect(linhas[2]).toBe('#EXTINF:6.0,');
    expect(linhas[3]).toContain('/midia/hls/arq123456789/720p_000.ts?exp=');
    expect(linhas[3]).toContain('sig=');
  });

  it('assina URI dentro de atributo e nao mexe em URL absoluta', () => {
    const original = [
      '#EXT-X-MAP:URI="init.mp4"',
      '#EXT-X-KEY:METHOD=AES-128,URI="https://cdn.exemplo/chave"',
      'https://cdn.exemplo/segmento.ts'
    ].join('\n');

    const saida = reescreverPlaylist(original, (interno) => `/assinado/${interno}`);

    expect(saida).toContain('URI="/assinado/init.mp4"');
    expect(saida).toContain('URI="https://cdn.exemplo/chave"');
    expect(saida).toContain('https://cdn.exemplo/segmento.ts');
  });
});

describe('interpretarFaixa', () => {
  it('le uma faixa comum', () => {
    expect(interpretarFaixa('bytes=0-499', 1000)).toEqual({ inicio: 0, fim: 499 });
  });

  it('faixa aberta vai ate o fim do arquivo', () => {
    expect(interpretarFaixa('bytes=500-', 1000)).toEqual({ inicio: 500, fim: 999 });
  });

  it('sufixo pega os ultimos bytes', () => {
    expect(interpretarFaixa('bytes=-200', 1000)).toEqual({ inicio: 800, fim: 999 });
  });

  it('devolve null para cabecalho ausente ou sem sentido', () => {
    expect(interpretarFaixa(null, 1000)).toBeNull();
    expect(interpretarFaixa('bytes=-', 1000)).toBeNull();
    expect(interpretarFaixa('itens=0-10', 1000)).toBeNull();
    expect(interpretarFaixa('bytes=900-100', 1000)).toBeNull();
    expect(interpretarFaixa('bytes=5000-6000', 1000)).toBeNull();
  });
});
