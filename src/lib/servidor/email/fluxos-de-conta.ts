// Arquivo: src/lib/servidor/email/fluxos-de-conta.ts
// Junta token + mensagem + envio num lugar so, pra rota nao precisar saber de nada disso.

import { criarTokenDeRecuperacao, criarTokenDeVerificacao } from '../autenticacao/tokens-email.js';
import { banco } from '../banco/cliente.js';
import { enviarEmailSemQuebrar } from './enviar.js';
import { mensagemDeRecuperacao, mensagemDeVerificacao } from './mensagens.js';

export function enderecoDeVerificacao(origem: string, token: string): string {
  return `${origem}/verificar-email?token=${encodeURIComponent(token)}`;
}

export function enderecoDeRedefinicao(origem: string, token: string): string {
  return `${origem}/redefinir-senha?token=${encodeURIComponent(token)}`;
}

export async function enviarVerificacaoDeEmail(
  origem: string,
  usuario: { id: string; email: string; nome: string }
): Promise<boolean> {
  const token = await criarTokenDeVerificacao(usuario.id);
  return enviarEmailSemQuebrar(
    mensagemDeVerificacao(usuario.email, usuario.nome, enderecoDeVerificacao(origem, token))
  );
}

/**
 * Nunca conta se o e-mail existe. Conta inexistente, token recente e falha de envio
 * terminam iguais: silencio. Quem pediu ve sempre a mesma tela.
 */
export async function enviarRecuperacaoDeSenha(origem: string, email: string): Promise<void> {
  const usuario = await banco.usuario.findUnique({ where: { email } });
  if (!usuario) return;

  const token = await criarTokenDeRecuperacao(usuario.id);
  if (!token) return;

  await enviarEmailSemQuebrar(
    mensagemDeRecuperacao(usuario.email, usuario.nome, enderecoDeRedefinicao(origem, token))
  );
}
