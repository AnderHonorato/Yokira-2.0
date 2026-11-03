// Garante que vídeos maiores que 2 GiB cabem no banco sem recriar nenhum registro.

import { describe, expect, it } from 'vitest';
import { banco } from '../../src/lib/servidor/banco/cliente';

describe('tamanho de mídia em 64 bits', () => {
  it('persiste um tamanho acima de 4 GiB sem arredondamento', async () => {
    const episodio = await banco.episodio.findFirst({ select: { id: true } });
    if (!episodio) throw new Error('A suíte precisa do catálogo de testes semeado.');

    const tamanho = 5n * 1024n * 1024n * 1024n;
    const registro = await banco.arquivoMidia.create({
      data: {
        episodioId: episodio.id,
        caminho: '/tmp/yokira-testes-somente-metadados.mp4',
        tamanhoBytes: tamanho
      }
    });
    try {
      const consultado = await banco.arquivoMidia.findUnique({
        where: { id: registro.id },
        select: { tamanhoBytes: true }
      });
      expect(consultado?.tamanhoBytes).toBe(tamanho);
    } finally {
      await banco.arquivoMidia.delete({ where: { id: registro.id } });
    }
  });
});
