// A publicação do HLS nunca deve deixar a versão anterior inutilizável.

import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { publicarPastaHls } from '../../src/lib/servidor/processamento/publicar-hls';

async function preparar() {
  const raiz = await mkdtemp(join(tmpdir(), 'yokira-publicacao-'));
  const destino = join(raiz, 'hls-atual');
  const nova = join(raiz, 'hls-nova');
  await mkdir(destino);
  await mkdir(nova);
  await writeFile(join(destino, 'mestre.m3u8'), 'VERSAO-ANTIGA');
  await writeFile(join(nova, 'mestre.m3u8'), 'VERSAO-NOVA');
  return { raiz, destino, nova };
}

describe('publicar pasta HLS', () => {
  it('substitui a versão completa após confirmar o banco', async () => {
    const pastas = await preparar();
    try {
      let confirmou = false;
      await publicarPastaHls(pastas.nova, pastas.destino, async () => {
        confirmou = true;
      });
      expect(confirmou).toBe(true);
      expect(await readFile(join(pastas.destino, 'mestre.m3u8'), 'utf8')).toBe('VERSAO-NOVA');
    } finally {
      await rm(pastas.raiz, { recursive: true, force: true });
    }
  });

  it('restaura a pasta anterior se a confirmação falhar', async () => {
    const pastas = await preparar();
    try {
      await expect(
        publicarPastaHls(pastas.nova, pastas.destino, async () => {
          throw new Error('Transação indisponível');
        })
      ).rejects.toThrow('Transação indisponível');
      expect(await readFile(join(pastas.destino, 'mestre.m3u8'), 'utf8')).toBe('VERSAO-ANTIGA');
    } finally {
      await rm(pastas.raiz, { recursive: true, force: true });
    }
  });

  it('recupera a pasta antiga após queda entre duas renomeações', async () => {
    const pastas = await preparar();
    try {
      const { rename } = await import('node:fs/promises');
      await rename(pastas.destino, `${pastas.destino}.anterior`);
      await publicarPastaHls(pastas.nova, pastas.destino, async () => {});
      expect(await readFile(join(pastas.destino, 'mestre.m3u8'), 'utf8')).toBe('VERSAO-NOVA');
    } finally {
      await rm(pastas.raiz, { recursive: true, force: true });
    }
  });
});
