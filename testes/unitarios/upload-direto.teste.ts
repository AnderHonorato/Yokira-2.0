// Limites, origem e metadados precisam ser recusados ANTES de receber gigabytes.

import { describe, expect, it } from 'vitest';
import {
  ErroDeUpload,
  LIMITE_VIDEO_BYTES,
  validarUploadDireto
} from '../../src/lib/validacoes/upload-direto';

const ORIGEM = 'https://yokira.exemplo';
function cabecalhos(extra: Record<string, string> = {}): Headers {
  return new Headers({
    origin: ORIGEM,
    'content-type': 'application/octet-stream',
    'x-nome-arquivo': encodeURIComponent('Episódio 1.mp4'),
    'content-length': '1024',
    ...extra
  });
}

describe('validação de upload direto', () => {
  it('aceita nomes codificados e stream binário', () => {
    expect(validarUploadDireto(cabecalhos(), ORIGEM)).toBe('Episódio 1.mp4');
  });

  it('rejeita envio de outra origem, inclusive sem Origin', () => {
    expect(() =>
      validarUploadDireto(cabecalhos({ origin: 'https://malicioso.exemplo' }), ORIGEM)
    ).toThrow('Origem não autorizada.');
    expect(() => validarUploadDireto(cabecalhos({ origin: '' }), ORIGEM)).toThrow(
      'Origem não autorizada.'
    );
  });

  it('barra tipo errado, extensão proibida e nome malformado', () => {
    for (const headers of [
      { 'content-type': 'application/json' },
      { 'x-nome-arquivo': encodeURIComponent('arquivo.exe') },
      { 'x-nome-arquivo': '%ZZ' },
      { 'x-nome-arquivo': encodeURIComponent('video\u0000.mp4') }
    ]) {
      expect(() => validarUploadDireto(cabecalhos(headers), ORIGEM)).toThrow();
    }
  });

  it('valida tamanho antes da leitura do corpo, sem confiar no valor declarado', () => {
    expect(() =>
      validarUploadDireto(cabecalhos({ 'content-length': String(LIMITE_VIDEO_BYTES + 1) }), ORIGEM)
    ).toThrow('limite');
    expect(() => validarUploadDireto(cabecalhos({ 'content-length': 'infinito' }), ORIGEM)).toThrow(
      'limite'
    );
  });

  it('retorna erros HTTP sem expor dados internos', () => {
    expect(new ErroDeUpload('Origem não autorizada.', 403).status).toBe(403);
  });
});
