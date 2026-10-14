// Arquivo: src/routes/redefinir-senha/+page.server.ts
// O GET so confere o link; quem gasta o token e o POST. Consumir no GET faria um
// pre-carregador de link de e-mail queimar o token antes da pessoa digitar a senha.

import { fail, redirect } from '@sveltejs/kit';
import { banco } from '$servidor/banco/cliente';
import { gerarHashDeSenha } from '$servidor/autenticacao/senha';
import { revogarTodasAsSessoes } from '$servidor/autenticacao/sessao';
import {
  consumirTokenDeRecuperacao,
  usuarioDoTokenDeRecuperacao
} from '$servidor/autenticacao/tokens-email';
import { validarSenha } from '$lib/validacoes/conta';
import { ErroDeValidacao } from '$lib/validacoes/erro-validacao';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
  const token = url.searchParams.get('token') ?? '';
  // O token volta pro formulario: ja esta na URL, entao devolver nao expoe nada novo.
  return { token, linkValido: (await usuarioDoTokenDeRecuperacao(token)) !== null };
};

export const actions: Actions = {
  default: async ({ request, url }) => {
    const formulario = await request.formData();
    const token = String(formulario.get('token') ?? url.searchParams.get('token') ?? '');

    let senha: string;
    try {
      senha = validarSenha(formulario.get('senha'));
    } catch (erro) {
      if (erro instanceof ErroDeValidacao) return fail(400, { mensagem: erro.message });
      throw erro;
    }

    const usuarioId = await consumirTokenDeRecuperacao(token);
    if (!usuarioId) {
      return fail(400, { mensagem: 'Link expirado ou já usado. Peça um novo.' });
    }

    await banco.usuario.update({
      where: { id: usuarioId },
      data: {
        senhaHash: await gerarHashDeSenha(senha),
        // Quem troca a senha por recuperacao pode estar expulsando um invasor:
        // deixar as sessoes antigas de pe anularia o gesto.
        tentativasFalhas: 0,
        bloqueadoAte: null
      }
    });
    await revogarTodasAsSessoes(usuarioId);

    throw redirect(303, '/entrar?senha-redefinida=1');
  }
};
