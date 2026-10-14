// Arquivo: src/routes/api/progresso/+server.ts
// Grava onde o usuario parou. Chamado a cada 15s pelo player, nao a cada segundo.

import { json, error } from '@sveltejs/kit';
import { salvarProgresso } from '$servidor/banco/progresso';
import { validarProgresso } from '$lib/validacoes/lista';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.usuario) throw error(401, 'Precisa entrar na conta.');

  const dados = validarProgresso(await request.json());
  const registro = await salvarProgresso(locals.usuario.id, dados.episodioId, dados.segundos);
  if (!registro) throw error(404, 'Episódio não encontrado.');

  return json({ segundos: registro.segundos, concluido: registro.concluido });
};
