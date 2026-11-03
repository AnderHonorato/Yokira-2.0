// Upload binário de vídeo: evita request.formData(), que guarda multipart na memória.
// O limite é conferido antes e durante a gravação; a sessão é exigida em cada POST.

import { error, json } from '@sveltejs/kit';
import { banco } from '$servidor/banco/cliente';
import { gravarFluxo } from '$servidor/armazenamento/gravar-upload';
import { registrarAcaoAdministrativa } from '$servidor/autenticacao/confirmacao';
import { exigirPapel } from '$servidor/permissoes/papeis';
import { ErroDeUpload, validarUploadDireto } from '$lib/validacoes/upload-direto';
import { processarArquivo } from '$servidor/processamento/fila-video';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals, url }) => {
  exigirPapel(locals.usuario?.papel, 'EDITOR');

  let nome: string;
  try {
    nome = validarUploadDireto(request.headers, url.origin);
  } catch (erro) {
    if (erro instanceof ErroDeUpload) throw error(erro.status, erro.message);
    throw erro;
  }

  const episodioId = url.searchParams.get('episodioId')?.trim() ?? '';
  if (!episodioId || episodioId.length > 80) {
    throw error(400, 'Selecione um episódio válido.');
  }
  const episodio = await banco.episodio.findUnique({
    where: { id: episodioId },
    select: { id: true }
  });
  if (!episodio) throw error(404, 'Episódio não encontrado.');
  if (!request.body) throw error(400, 'Selecione um arquivo de vídeo.');

  let registro;
  try {
    registro = await gravarFluxo(episodioId, request.body, nome);
  } catch (falha) {
    const mensagem = falha instanceof Error ? falha.message : 'Falha ao receber o arquivo.';
    if (mensagem.includes('limite')) throw error(413, mensagem);
    throw error(400, mensagem);
  }

  await registrarAcaoAdministrativa(locals.usuario!.id, 'enviar-video', episodioId, nome);
  // Confirma que o trabalho foi persistido antes de responder ao painel.
  await processarArquivo(registro.id);

  return json(
    { recebido: true, arquivoId: registro.id, mensagem: 'Vídeo recebido e colocado na fila de conversão HLS.' },
    { status: 202, headers: { 'cache-control': 'private, no-store' } }
  );
};
