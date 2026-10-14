// Arquivo: src/routes/api/minha-lista/+server.ts
// Adiciona/remove titulo da lista do usuario. Autorizacao sempre no servidor.

import { json, error } from '@sveltejs/kit';
import { alternarItemDaLista } from '$servidor/banco/lista';
import { validarAlternarLista } from '$lib/validacoes/lista';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.usuario) throw error(401, 'Precisa entrar na conta.');

  const dados = validarAlternarLista(await request.json());
  const resultado = await alternarItemDaLista(locals.usuario.id, dados.tituloId);

  return json({ naLista: resultado.naLista });
};
