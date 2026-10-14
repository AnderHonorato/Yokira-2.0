// Arquivo: src/routes/api/consumo/+server.ts

import { error, json } from '@sveltejs/kit';
import { lerHeatmap, registrarConsumo } from '$servidor/banco/consumo';
import { atualizarRankingPorEpisodio } from '$servidor/banco/ranking';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
  const episodioId = String(url.searchParams.get('episodioId') ?? '').trim();
  if (!episodioId) throw error(400, 'episodioId é obrigatório.');
  return json(await lerHeatmap(episodioId));
};

export const POST: RequestHandler = async ({ request, locals }) => {
  const corpo = (await request.json()) as Record<string, unknown>;
  const episodioId = String(corpo.episodioId ?? '').trim();
  const chave = String(corpo.chave ?? '').trim();
  if (!episodioId || chave.length < 8 || chave.length > 200) {
    throw error(400, 'Sinal de consumo inválido.');
  }

  const resultado = await registrarConsumo(
    episodioId,
    chave,
    Number(corpo.segundo ?? 0),
    locals.usuario?.id
  );
  if (resultado.novaSessao) await atualizarRankingPorEpisodio(episodioId);
  return json({ ok: true, ...resultado });
};
