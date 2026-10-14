// Arquivo: src/routes/admin/enviar/+page.server.ts
// Recebe o video por upload OU por link, grava fora de static/ e dispara o ffmpeg sem
// segurar a resposta.

import { fail } from '@sveltejs/kit';
import { banco } from '$servidor/banco/cliente';
import { gravarBytes, gravarUpload } from '$servidor/armazenamento/gravar-upload';
import { baixarVideo, ErroDeDownload } from '$servidor/armazenamento/baixar-de-url';
import { processarArquivo } from '$servidor/processamento/transcodificar';
import { registrarAcaoAdministrativa } from '$servidor/autenticacao/confirmacao';
import { exigirPapel } from '$servidor/permissoes/papeis';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const episodios = await banco.episodio.findMany({
    take: 60,
    orderBy: [{ temporada: { titulo: { nome: 'asc' } } }, { numero: 'asc' }],
    include: { temporada: { include: { titulo: { select: { nome: true } } } } }
  });

  return {
    episodios: episodios.map((episodio) => ({
      id: episodio.id,
      rotulo: `${episodio.temporada.titulo.nome} — T${episodio.temporada.numero} EP${episodio.numero}`
    }))
  };
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    exigirPapel(locals.usuario?.papel, 'EDITOR');

    const formulario = await request.formData();
    const episodioId = String(formulario.get('episodioId') ?? '');
    const link = String(formulario.get('link') ?? '').trim();
    const arquivo = formulario.get('arquivo');
    const temArquivo = arquivo instanceof File && arquivo.size > 0;

    if (!temArquivo && link === '') {
      return fail(400, { mensagem: 'Escolha um arquivo ou informe um link.' });
    }

    try {
      // Com os dois preenchidos o arquivo ganha: ele ja esta aqui e nao depende de
      // rede nem do que o outro lado resolva devolver.
      const registro = temArquivo
        ? await gravarUpload(episodioId, arquivo)
        : await (async () => {
            const baixado = await baixarVideo(link);
            return gravarBytes(episodioId, baixado.bytes, baixado.nome);
          })();

      await registrarAcaoAdministrativa(
        locals.usuario!.id,
        temArquivo ? 'enviar-video' : 'enviar-video-por-link',
        episodioId,
        temArquivo ? arquivo.name : link
      );

      // Sem await: transcodificar 3 variantes leva minutos e a resposta nao pode esperar.
      void processarArquivo(registro.id);

      return {
        mensagem: temArquivo
          ? 'Arquivo recebido. A conversão para HLS começou.'
          : 'Vídeo baixado do link. A conversão para HLS começou.'
      };
    } catch (erro) {
      if (erro instanceof ErroDeDownload) return fail(400, { mensagem: erro.message });
      return fail(400, { mensagem: erro instanceof Error ? erro.message : 'Falha no envio.' });
    }
  }
};
