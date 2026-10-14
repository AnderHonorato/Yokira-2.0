// Arquivo: src/routes/entrar/+page.server.ts
// Form action em vez de fetch: funciona mesmo se o JavaScript falhar.

import { fail, redirect } from '@sveltejs/kit';
import { autenticarUsuario, ErroDeAutenticacao } from '$servidor/banco/conta';
import { criarSessao } from '$servidor/autenticacao/sessao';
import { gravarCookieDeSessao } from '$servidor/autenticacao/cookie';
import { validarEmail } from '$lib/validacoes/conta';
import { ErroDeValidacao } from '$lib/validacoes/erro-validacao';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
  if (locals.usuario) throw redirect(303, '/');
  return { senhaRedefinida: url.searchParams.get('senha-redefinida') === '1' };
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const formulario = await request.formData();
    const email = String(formulario.get('email') ?? '');
    const senha = String(formulario.get('senha') ?? '');

    try {
      const usuario = await autenticarUsuario(validarEmail(email), senha);
      const sessao = await criarSessao(usuario.id, request.headers.get('user-agent') ?? undefined);
      gravarCookieDeSessao(cookies, sessao.id, sessao.expiraEm);
    } catch (erro) {
      if (erro instanceof ErroDeAutenticacao || erro instanceof ErroDeValidacao) {
        return fail(400, { email, mensagem: erro.message });
      }
      throw erro;
    }

    throw redirect(303, '/');
  }
};
