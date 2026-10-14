// Arquivo: src/routes/api/avaliacao/+server.ts

import { json, error } from '@sveltejs/kit';
import { avaliarTitulo, removerAvaliacao } from '$servidor/banco/avaliacao';
import { validarAvaliacao } from '$lib/validacoes/lista';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.usuario) throw error(401, 'Precisa entrar na conta.');

  const dados = validarAvaliacao(await request.json());

  const resultado =
    dados.nota === null
      ? await removerAvaliacao(locals.usuario.id, dados.tituloId)
      : await avaliarTitulo(locals.usuario.id, dados.tituloId, dados.nota);

  return json(resultado);
};
