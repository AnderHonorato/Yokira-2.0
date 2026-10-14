// Arquivo: src/routes/api/confirmacao/+server.ts
// Passo 1 da dupla confirmacao: emite o token de uso unico que o passo 2 vai gastar.

import { json, error } from '@sveltejs/kit';
import { emitirTokenDeConfirmacao } from '$servidor/autenticacao/confirmacao';
import { exigirTexto } from '$lib/validacoes/erro-validacao';
import type { RequestHandler } from './$types';

const ACOES_PERMITIDAS = new Set([
  'excluir-conta',
  'excluir-titulo',
  'excluir-temporada',
  'excluir-episodio',
  'remover-usuario',
  'trocar-papel',
  'despublicar-conteudo',
  'limpar-historico',
  'limpar-dados-baixados',
  'encerrar-sessoes',
  'reprocessar-video'
]);

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.usuario) throw error(401, 'Precisa entrar na conta.');

  const corpo = (await request.json()) as Record<string, unknown>;
  const acao = exigirTexto(corpo.acao, 'acao', 40);
  if (!ACOES_PERMITIDAS.has(acao)) throw error(400, 'Ação desconhecida.');

  const alvo = typeof corpo.alvo === 'string' ? corpo.alvo : undefined;
  const { token } = await emitirTokenDeConfirmacao(locals.usuario.id, acao, alvo);

  return json({ token });
};
