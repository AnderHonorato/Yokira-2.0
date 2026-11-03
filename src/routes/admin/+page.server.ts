// Arquivo: src/routes/admin/+page.server.ts

import { fail } from '@sveltejs/kit';
import { banco } from '$servidor/banco/cliente';
import { registrarAcaoAdministrativa } from '$servidor/autenticacao/confirmacao';
import { exigirPapel } from '$servidor/permissoes/papeis';
import { ffmpegDisponivel } from '$servidor/processamento/transcodificar';
import { temPapelMinimo } from '$servidor/permissoes/papeis';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const [titulos, episodios, trabalhos, denunciasAbertas, temFfmpeg] = await Promise.all([
    banco.titulo.count(),
    banco.episodio.count(),
    banco.trabalhoProcessamento.findMany({ orderBy: { criadoEm: 'desc' }, take: 10 }),
    banco.denuncia.count({ where: { resolvida: false } }),
    ffmpegDisponivel()
  ]);

  // Os atalhos saem prontos daqui: a tela nao precisa importar a tabela de papeis
  // (que e codigo de servidor) so pra decidir o que mostrar.
  return {
    titulos,
    episodios,
    trabalhos,
    denunciasAbertas,
    temFfmpeg,
    podeModerar: temPapelMinimo(locals.usuario?.papel, 'MODERADOR'),
    podeGerirUsuarios: temPapelMinimo(locals.usuario?.papel, 'ADMINISTRADOR')
  };
};

/** Só editores podem reagendar uma conversão com falha comprovada. */
export const actions: Actions = {
  retentar: async ({ request, locals }) => {
    exigirPapel(locals.usuario?.papel, 'EDITOR');

    const formulario = await request.formData();
    const trabalhoId = String(formulario.get('trabalhoId') ?? '').trim();
    if (!trabalhoId || trabalhoId.length > 100) {
      return fail(400, { mensagem: 'Trabalho inválido.' });
    }

    const trabalho = await banco.trabalhoProcessamento.findUnique({
      where: { id: trabalhoId },
      select: { arquivoId: true, situacao: true }
    });
    if (!trabalho) return fail(404, { mensagem: 'Trabalho não encontrado.' });
    if (trabalho.situacao !== 'FALHOU') {
      return fail(409, { mensagem: 'Somente trabalhos com falha podem ser retomados.' });
    }

    const ativo = await banco.trabalhoProcessamento.findFirst({
      where: { arquivoId: trabalho.arquivoId, situacao: { in: ['NA_FILA', 'PROCESSANDO'] } },
      select: { id: true }
    });
    if (ativo) {
      return fail(409, { mensagem: 'Este vídeo já está na fila de processamento.' });
    }

    // Reivindicação condicional: dois cliques não podem reagendar duas conversões.
    const resultado = await banco.trabalhoProcessamento.updateMany({
      where: { id: trabalhoId, situacao: 'FALHOU' },
      data: { situacao: 'NA_FILA', progresso: 0, mensagem: null }
    });
    if (resultado.count !== 1) {
      return fail(409, { mensagem: 'O trabalho já foi reagendado.' });
    }

    await registrarAcaoAdministrativa(
      locals.usuario!.id,
      'retentar-processamento',
      trabalho.arquivoId
    );

    return { mensagem: 'Conversão reagendada. Acompanhe a fila nesta página.' };
  }
};
