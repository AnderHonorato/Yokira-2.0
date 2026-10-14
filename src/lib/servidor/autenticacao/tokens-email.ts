// Arquivo: src/lib/servidor/autenticacao/tokens-email.ts
// Tokens que viajam por e-mail: verificacao de endereco e recuperacao de senha.
//
// Guardamos o SHA-256, nunca o token cru — mesma escolha da sessao. Quem ler o banco
// (backup vazado, log de consulta) nao consegue redefinir a senha de ninguem.

import { createHash, randomBytes } from 'node:crypto';
import { banco } from '../banco/cliente.js';

export const VALIDADE_VERIFICACAO_MS = 24 * 60 * 60 * 1000;
export const VALIDADE_RECUPERACAO_MS = 60 * 60 * 1000;

/** Intervalo minimo entre dois pedidos de recuperacao pro mesmo e-mail. */
export const INTERVALO_ENTRE_PEDIDOS_MS = 60 * 1000;

function digerir(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function gerar(): string {
  return randomBytes(32).toString('base64url');
}

export async function criarTokenDeVerificacao(usuarioId: string): Promise<string> {
  const token = gerar();
  // Um token valido por vez: pedir de novo invalida o anterior.
  await banco.tokenVerificacao.deleteMany({ where: { usuarioId } });
  await banco.tokenVerificacao.create({
    data: {
      usuarioId,
      token: digerir(token),
      expiraEm: new Date(Date.now() + VALIDADE_VERIFICACAO_MS)
    }
  });
  return token;
}

/** Marca o e-mail como verificado. Devolve false quando o token nao serve. */
export async function consumirTokenDeVerificacao(token: string): Promise<boolean> {
  if (!token) return false;

  const registro = await banco.tokenVerificacao.findUnique({ where: { token: digerir(token) } });
  if (!registro || registro.expiraEm < new Date()) return false;

  await banco.usuario.update({
    where: { id: registro.usuarioId },
    data: { emailVerificado: true }
  });
  await banco.tokenVerificacao.deleteMany({ where: { usuarioId: registro.usuarioId } });
  return true;
}

/** Devolve null quando ja houve um pedido ha menos de um minuto. */
export async function criarTokenDeRecuperacao(usuarioId: string): Promise<string | null> {
  const recente = await banco.tokenRecuperacao.findFirst({
    where: {
      usuarioId,
      usadoEm: null,
      expiraEm: { gt: new Date(Date.now() + VALIDADE_RECUPERACAO_MS - INTERVALO_ENTRE_PEDIDOS_MS) }
    }
  });
  if (recente) return null;

  const token = gerar();
  await banco.tokenRecuperacao.create({
    data: {
      usuarioId,
      token: digerir(token),
      expiraEm: new Date(Date.now() + VALIDADE_RECUPERACAO_MS)
    }
  });
  return token;
}

/** Le sem gastar: a tela de redefinir precisa saber se o link presta antes de pedir a senha. */
export async function usuarioDoTokenDeRecuperacao(token: string): Promise<string | null> {
  if (!token) return null;

  const registro = await banco.tokenRecuperacao.findUnique({ where: { token: digerir(token) } });
  if (!registro || registro.usadoEm || registro.expiraEm < new Date()) return null;
  return registro.usuarioId;
}

/** Gasta o token. Devolve null se ja tinha sido usado — a corrida perde aqui. */
export async function consumirTokenDeRecuperacao(token: string): Promise<string | null> {
  if (!token) return null;

  const registro = await banco.tokenRecuperacao.findUnique({ where: { token: digerir(token) } });
  if (!registro || registro.usadoEm || registro.expiraEm < new Date()) return null;

  // updateMany com usadoEm: null e a trava: duas abas com o mesmo link, so uma passa.
  const gasto = await banco.tokenRecuperacao.updateMany({
    where: { id: registro.id, usadoEm: null },
    data: { usadoEm: new Date() }
  });
  if (gasto.count === 0) return null;

  return registro.usuarioId;
}
