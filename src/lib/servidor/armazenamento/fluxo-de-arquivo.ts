// Grava um fluxo por partes, sem carregar o video inteiro na memoria.
// A limpeza e obrigatoria: arquivo parcial nunca pode ficar como upload valido.

import { open, unlink } from 'node:fs/promises';

export async function gravarFluxoLimitado(
  caminho: string,
  fluxo: ReadableStream<Uint8Array>,
  limite: number
): Promise<number> {
  const arquivo = await open(caminho, 'wx');
  const leitor = fluxo.getReader();
  let total = 0;

  try {
    while (true) {
      const { done, value } = await leitor.read();
      if (done) break;
      if (!value?.byteLength) continue;

      total += value.byteLength;
      if (total > limite) throw new Error('Arquivo acima do limite.');

      let inicio = 0;
      while (inicio < value.byteLength) {
        const { bytesWritten } = await arquivo.write(value, inicio, value.byteLength - inicio);
        if (bytesWritten === 0) throw new Error('Falha na gravação do arquivo.');
        inicio += bytesWritten;
      }
    }

    if (total === 0) throw new Error('Arquivo vazio.');
    await arquivo.close();
    return total;
  } catch (erro) {
    await leitor.cancel().catch(() => {});
    await arquivo.close().catch(() => {});
    await unlink(caminho).catch(() => {});
    throw erro;
  } finally {
    leitor.releaseLock();
  }
}
