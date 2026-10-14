// Arquivo: src/lib/servidor/autenticacao/confirmacao.ts
// Passo 1 da dupla confirmacao emite um token de uso unico; o passo 2 gasta ele.
// Sem isso alguem chamaria a API de exclusao direto no curl e pularia a interface inteira.

import { randomBytes } from 'node:crypto';
import { error } from '@sveltejs/kit';
import { banco } from '../banco/cliente.js';

const VALIDADE_MS = 1000 * 60 * 5;

export async function emitirTokenDeConfirmacao(
  usuarioId: string,
  acao: string,
  alvo?: string
): Promise<{ token: string; expiraEm: Date }> {
  const token = randomBytes(24).toString('base64url');
  const expiraEm = new Date(Date.now() + VALIDADE_MS);

  await banco.tokenConfirmacao.create({
    data: { usuarioId, acao, alvo: alvo ?? null, token, expiraEm }
  });

  return { token, expiraEm };
}

/** Consome o token. Chamar duas vezes com o mesmo token e erro — e essa e a graca. */
export async function consumirTokenDeConfirmacao(
  usuarioId: string,
  acao: string,
  token: string,
  alvo?: string
): Promise<void> {
  const registro = await banco.tokenConfirmacao.findUnique({ where: { token } });

  const invalido =
    !registro ||
    registro.usuarioId !== usuarioId ||
    registro.acao !== acao ||
    registro.usadoEm !== null ||
    registro.expiraEm < new Date() ||
    (alvo !== undefined && registro.alvo !== alvo);

  if (invalido) throw error(400, 'Confirmacao invalida ou expirada. Refaca a acao.');

  await banco.tokenConfirmacao.update({
    where: { id: registro.id },
    data: { usadoEm: new Date() }
  });
}

export async function registrarAcaoAdministrativa(
  usuarioId: string | null,
  acao: string,
  alvo?: string,
  detalhe?: string
): Promise<void> {
  await banco.registroAdministrativo.create({
    data: { usuarioId, acao, alvo: alvo ?? null, detalhe: detalhe ?? null }
  });
}
