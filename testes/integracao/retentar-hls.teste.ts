// Testa autorização e mudança de estado real no banco do painel.

import { describe, expect, it } from 'vitest';
import { actions } from '../../src/routes/admin/+page.server';
import { banco } from '../../src/lib/servidor/banco/cliente';

async function retentar(trabalhoId: string, usuario: unknown) {
  const acao = actions.retentar;
  if (!acao) throw new Error('A action de nova tentativa não foi registrada.');
  const pedido = new Request('http://localhost/admin?/retentar', {
    method: 'POST',
    body: new URLSearchParams({ trabalhoId })
  });
  return acao({
    request: pedido,
    locals: { usuario }
  } as unknown as Parameters<typeof acao>[0]);
}

describe('nova tentativa de conversão no painel', () => {
  it('recusa visitante e espectador antes de consultar o trabalho', async () => {
    await expect(retentar('inexistente', null)).rejects.toMatchObject({ status: 401 });
    await expect(
      retentar('inexistente', { id: 'espectador', papel: 'ESPECTADOR' })
    ).rejects.toMatchObject({ status: 403 });
  });

  it('reagenda uma conversão com falha somente uma vez e registra auditoria', async () => {
    const administrador = await banco.usuario.findUnique({
      where: { email: 'admin@yokira.local' },
      select: { id: true }
    });
    const episodio = await banco.episodio.findFirst({ select: { id: true } });
    if (!administrador || !episodio) throw new Error('Banco dos testes não semeado.');

    const arquivo = await banco.arquivoMidia.create({
      data: {
        episodioId: episodio.id,
        caminho: '/tmp/yokira-retry-somente-metadados.mp4',
        tamanhoBytes: 10n
      }
    });

    try {
      const trabalho = await banco.trabalhoProcessamento.create({
        data: { arquivoId: arquivo.id, situacao: 'FALHOU', mensagem: 'Falha simulada' }
      });
      const usuario = { id: administrador.id, papel: 'ADMINISTRADOR' };

      expect(await retentar(trabalho.id, usuario)).toMatchObject({
        mensagem: 'Conversão reagendada. Acompanhe a fila nesta página.'
      });

      const recuperado = await banco.trabalhoProcessamento.findUniqueOrThrow({
        where: { id: trabalho.id }
      });
      expect(recuperado.situacao).toBe('NA_FILA');
      expect(recuperado.progresso).toBe(0);
      expect(recuperado.mensagem).toBeNull();

      const duplicado = await retentar(trabalho.id, usuario);
      expect(duplicado).toMatchObject({ status: 409 });

      const auditoria = await banco.registroAdministrativo.findFirst({
        where: {
          usuarioId: administrador.id,
          acao: 'retentar-processamento',
          alvo: arquivo.id
        }
      });
      expect(auditoria).not.toBeNull();
    } finally {
      await banco.registroAdministrativo.deleteMany({
        where: { usuarioId: administrador.id, acao: 'retentar-processamento', alvo: arquivo.id }
      });
      await banco.arquivoMidia.delete({ where: { id: arquivo.id } });
    }
  });
});
