// Arquivo: src/routes/api/audiencia/+server.ts
// Heartbeat de quem esta assistindo. Aceita visitante sem conta: o numero da tela conta
// pessoas, nao contas.

import { json } from '@sveltejs/kit';
import { contarAudiencia, registrarSinal } from '$servidor/banco/audiencia';
import { validarSinalDeAudiencia } from '$lib/validacoes/lista';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
  const dados = validarSinalDeAudiencia(await request.json());
  await registrarSinal(dados.episodioId, dados.chave, locals.usuario?.id);
  return json({ assistindo: await contarAudiencia(dados.episodioId) });
};
