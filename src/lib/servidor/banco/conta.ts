// Arquivo: src/lib/servidor/banco/conta.ts
// Cadastro e login. Deixei o "usuario nao existe" e "senha errada" com a mesma resposta
// pra nao virar oraculo de e-mails cadastrados.

import { banco } from './cliente.js';
import { conferirSenha, gerarHashDeSenha } from '../autenticacao/senha.js';
import { estaBloqueado, limparFalhas, registrarFalha } from '../autenticacao/limite-tentativas.js';

export class ErroDeAutenticacao extends Error {}

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
