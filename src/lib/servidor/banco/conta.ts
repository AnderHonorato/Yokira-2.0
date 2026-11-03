// Arquivo: src/lib/servidor/banco/conta.ts
// Cadastro e login. Deixei o "usuario nao existe" e "senha errada" com a mesma resposta
// pra nao virar oraculo de e-mails cadastrados.

import { banco } from './cliente.js';
import { conferirSenha, gerarHashDeSenha } from '../autenticacao/senha.js';
import { estaBloqueado, limparFalhas, registrarFalha } from '../autenticacao/limite-tentativas.js';

export class ErroDeAutenticacao extends Error {}

/** Contas antigas semeadas com senha pública não devem autenticar em produção. */
export function senhaDeDemonstracaoBloqueada(
  senha: string,
  ambiente = process.env.NODE_ENV,
  e2e = process.env.YOKIRA_MODO_TESTE_E2E
): boolean {
  return (
    ambiente === 'production' &&
    e2e !== '1' &&
    (senha === 'YokiraAdmin#2024' || senha === 'YokiraDemo#2024')
  );
}

export async function cadastrarUsuario(email: string, senha: string, nome: string) {
  const jaExiste = await banco.usuario.findUnique({ where: { email } });
  if (jaExiste) throw new ErroDeAutenticacao('Ja existe uma conta com este e-mail.');

  return banco.usuario.create({
    data: {
      email,
      nome,
      senhaHash: await gerarHashDeSenha(senha),
      perfis: { create: { apelido: nome } }
    }
  });
}

export async function autenticarUsuario(email: string, senha: string) {
  if (senhaDeDemonstracaoBloqueada(senha)) {
    throw new ErroDeAutenticacao('E-mail ou senha incorretos.');
  }

  const usuario = await banco.usuario.findUnique({ where: { email } });
  if (!usuario) throw new ErroDeAutenticacao('E-mail ou senha incorretos.');

  if (estaBloqueado(usuario.bloqueadoAte)) {
    throw new ErroDeAutenticacao('Muitas tentativas. Tente de novo em alguns minutos.');
  }

  const senhaConfere = await conferirSenha(usuario.senhaHash, senha);
  if (!senhaConfere) {
    await registrarFalha(usuario.id, usuario.tentativasFalhas);
    throw new ErroDeAutenticacao('E-mail ou senha incorretos.');
  }

  await limparFalhas(usuario.id);
  return usuario;
}

export async function excluirConta(usuarioId: string): Promise<void> {
  await banco.usuario.delete({ where: { id: usuarioId } });
}
