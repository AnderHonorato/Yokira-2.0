// Garante que uploads e downloads grandes nao gerem buffers gigantes nem lixo no disco.

import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { gravarFluxoLimitado } from '../../src/lib/servidor/armazenamento/fluxo-de-arquivo';

function fluxoDe(partes: number[][]): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controlador) {
      for (const parte of partes) controlador.enqueue(Uint8Array.from(parte));
      controlador.close();
    }
  });
}

describe('gravarFluxoLimitado', () => {
  it('grava blocos incrementais e retorna o tamanho verdadeiro', async () => {
    const pasta = await mkdtemp(join(tmpdir(), 'yokira-fluxo-'));
    const caminho = join(pasta, 'video.mp4');
    try {
      const tamanho = await gravarFluxoLimitado(
        caminho,
        fluxoDe([
          [1, 2],
          [3, 4, 5]
        ]),
        10
      );
      expect(tamanho).toBe(5);
      expect([...(await readFile(caminho))]).toEqual([1, 2, 3, 4, 5]);
    } finally {
      await rm(pasta, { recursive: true, force: true });
    }
  });

  it('rejeita tamanho acima do limite e exclui o arquivo parcial', async () => {
    const pasta = await mkdtemp(join(tmpdir(), 'yokira-fluxo-'));
    try {
      await expect(
        gravarFluxoLimitado(
          join(pasta, 'video.mp4'),
          fluxoDe([
            [1, 2],
            [3, 4]
          ]),
          3
        )
      ).rejects.toThrow('Arquivo acima do limite.');
      expect(await readdir(pasta)).toEqual([]);
    } finally {
      await rm(pasta, { recursive: true, force: true });
    }
  });

  it('rejeita stream vazio e nao deixa arquivo vazio', async () => {
    const pasta = await mkdtemp(join(tmpdir(), 'yokira-fluxo-'));
    try {
      await expect(gravarFluxoLimitado(join(pasta, 'video.mp4'), fluxoDe([]), 10)).rejects.toThrow(
        'Arquivo vazio.'
      );
      expect(await readdir(pasta)).toEqual([]);
    } finally {
      await rm(pasta, { recursive: true, force: true });
    }
  });
});
