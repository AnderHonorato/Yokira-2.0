// Fila HLS real no SQLite de teste: confirma estado persistente, reivindicacao
// unica e retomada. Nao exige vídeo nem FFmpeg para os cenarios de falha.

import { describe, expect, it } from 'vitest';
import { banco } from '../../src/lib/servidor/banco/cliente';
import {
  enfileirarArquivo,
  executarTrabalho,
  limiteDeRecuperacao,
  recuperarInterrompidos
} from '../../src/lib/servidor/processamento/fila-video';

async function arquivoFalso(): Promise<string> {
  const episodio = await banco.episodio.findFirst({ select: { id: true } });
  if (!episodio) throw new Error('O banco de teste precisa do catálogo semeado.');
  const arquivo = await banco.arquivoMidia.create({
    data: {
      episodioId: episodio.id,
      caminho: '/tmp/yokira-video-inexistente-do-teste.mp4',
      tamanhoBytes: 100n
    }
  });
  return arquivo.id;
}

describe('fila durável de vídeo', () => {
  it('grava na fila, evita agendar duplicado e falha sem revelar vídeo parcial', async () => {
    const arquivoId = await arquivoFalso();
    try {
      const id = await enfileirarArquivo(arquivoId);
      expect(await enfileirarArquivo(arquivoId)).toBe(id);
      const antes = await banco.trabalhoProcessamento.findUnique({ where: { id } });
      expect(antes?.situacao).toBe('NA_FILA');

      expect(await executarTrabalho(id)).toBe(true);
      expect(await executarTrabalho(id)).toBe(false);

      const depois = await banco.trabalhoProcessamento.findUnique({ where: { id } });
      expect(depois?.situacao).toBe('FALHOU');
      expect(depois?.mensagem).toContain('não foi encontrado');
      expect(await banco.varianteHls.count({ where: { arquivoId } })).toBe(0);
    } finally {
      await banco.arquivoMidia.delete({ where: { id: arquivoId } });
    }
  });

  it('recupera trabalhos sem batimento e preserva os ainda ativos', async () => {
    const arquivoId = await arquivoFalso();
    try {
      const id = await enfileirarArquivo(arquivoId);
      const agora = Date.now();
      expect(limiteDeRecuperacao(agora).getTime()).toBe(agora - 600_000);

      await banco.trabalhoProcessamento.update({
        where: { id },
        data: { situacao: 'PROCESSANDO', atualizadoEm: new Date(agora - 900_000) }
      });
      const recuperados = await recuperarInterrompidos(agora);
      expect(recuperados).toBeGreaterThanOrEqual(1);

      const trabalho = await banco.trabalhoProcessamento.findUnique({ where: { id } });
      expect(trabalho?.situacao).toBe('NA_FILA');
      expect(trabalho?.progresso).toBe(0);

      expect(await executarTrabalho(id)).toBe(true);
      expect((await banco.trabalhoProcessamento.findUnique({ where: { id } }))?.situacao)
        .toBe('FALHOU');
    } finally {
      await banco.arquivoMidia.delete({ where: { id: arquivoId } });
    }
  });
});
