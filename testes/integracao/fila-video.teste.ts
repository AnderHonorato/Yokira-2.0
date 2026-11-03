// A fila deve resistir à queda do servidor sem perder nem repetir trabalho.

import { describe, expect, it } from 'vitest';
import { banco } from '../../src/lib/servidor/banco/cliente';
import {
  enfileirarArquivo,
  executarTrabalho,
  limiteDeRecuperacao,
  recuperarInterrompidos
} from '../../src/lib/servidor/processamento/fila-video';

describe('fila HLS no banco', () => {
  it('calcula a janela de recuperação sem depender do relógio local', () => {
    expect(limiteDeRecuperacao(600_001).getTime()).toBe(1);
  });

  it('persiste, não duplica, recupera e registra falha sem FFmpeg', async () => {
    const episodio = await banco.episodio.findFirst({ select: { id: true } });
    if (!episodio) throw new Error('O banco dos testes precisa estar semeado.');

    // Não cria um arquivo real: a falha da entrada é usada para testar o estado.
    const original = await banco.arquivoMidia.create({
      data: {
        episodioId: episodio.id,
        caminho: '/caminho/que-nao-existe/yokira-fila.mp4',
        tamanhoBytes: 123n
      }
    });

    try {
      const id = await enfileirarArquivo(original.id);
      expect(await enfileirarArquivo(original.id)).toBe(id);

      const pendentes = await banco.trabalhoProcessamento.count({
        where: { arquivoId: original.id, situacao: 'NA_FILA' }
      });
      expect(pendentes).toBe(1);

      await banco.trabalhoProcessamento.update({
        where: { id },
        data: { situacao: 'PROCESSANDO', atualizadoEm: new Date('2020-01-01T00:00:00Z') }
      });
      expect(await recuperarInterrompidos(Date.now())).toBeGreaterThanOrEqual(1);

      const recuperado = await banco.trabalhoProcessamento.findUniqueOrThrow({ where: { id } });
      expect(recuperado.situacao).toBe('NA_FILA');

      expect(await executarTrabalho(id)).toBe(true);
      const falha = await banco.trabalhoProcessamento.findUniqueOrThrow({ where: { id } });
      expect(falha.situacao).toBe('FALHOU');
      expect(falha.mensagem).toContain('original');
      expect(await executarTrabalho(id)).toBe(false);
    } finally {
      await banco.arquivoMidia.delete({ where: { id: original.id } });
    }
  });
});
