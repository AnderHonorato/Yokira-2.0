// Arquivo: src/routes/api/conta/+server.ts
// Acoes destrutivas da conta. Todas exigem o tokenConfirmacao do passo 1 — a interface
// bonita nao e a barreira, a barreira e esta.

import { json, error } from '@sveltejs/kit';
import {
  consumirTokenDeConfirmacao,
  registrarAcaoAdministrativa
} from '$servidor/autenticacao/confirmacao';
import { excluirConta } from '$servidor/banco/conta';
import { limparHistorico } from '$servidor/banco/progresso';
import { revogarTodasAsSessoes } from '$servidor/autenticacao/sessao';
import { apagarCookieDeSessao } from '$servidor/autenticacao/cookie';
import { exigirTexto } from '$lib/validacoes/erro-validacao';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals, cookies }) => {
  if (!locals.usuario) throw error(401, 'Precisa entrar na conta.');

  const corpo = (await request.json()) as Record<string, unknown>;
  const acao = exigirTexto(corpo.acao, 'acao', 40);
  const token = exigirTexto(corpo.tokenConfirmacao, 'tokenConfirmacao', 80);

  await consumirTokenDeConfirmacao(locals.usuario.id, acao, token);

  const resultado = await executar(acao, locals.usuario.id);
  await registrarAcaoAdministrativa(locals.usuario.id, acao, locals.usuario.id);

  if (acao === 'excluir-conta' || acao === 'encerrar-sessoes') apagarCookieDeSessao(cookies);

  return json(resultado);
};

async function executar(acao: string, usuarioId: string) {
  if (acao === 'limpar-historico') return { removidos: await limparHistorico(usuarioId) };
  if (acao === 'encerrar-sessoes') return { sessoes: await revogarTodasAsSessoes(usuarioId) };
  if (acao === 'excluir-conta') {
    await excluirConta(usuarioId);
    return { excluida: true };
  }
  throw error(400, 'Ação não suportada neste endpoint.');
}
