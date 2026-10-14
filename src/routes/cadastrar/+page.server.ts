// Arquivo: src/routes/cadastrar/+page.server.ts

import { fail, redirect } from '@sveltejs/kit';
import { cadastrarUsuario, ErroDeAutenticacao } from '$servidor/banco/conta';
import { criarSessao } from '$servidor/autenticacao/sessao';
import { enviarVerificacaoDeEmail } from '$servidor/email/fluxos-de-conta';
import { gravarCookieDeSessao } from '$servidor/autenticacao/cookie';
import { validarEmail, validarNome, validarSenha } from '$lib/validacoes/conta';
import { ErroDeValidacao } from '$lib/validacoes/erro-validacao';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.usuario) throw redirect(303, '/');
  return {};
};

export const actions: Actions = {
  default: async ({ request, cookies, url }) => {
    const formulario = await request.formData();
    const email = String(formulario.get('email') ?? '');
    const nome = String(formulario.get('nome') ?? '');

    try {
      const usuario = await cadastrarUsuario(
        validarEmail(email),
        validarSenha(formulario.get('senha')),
        validarNome(nome)
      );
      const sessao = await criarSessao(usuario.id, request.headers.get('user-agent') ?? undefined);
      gravarCookieDeSessao(cookies, sessao.id, sessao.expiraEm);

      // Sem await no resultado: e-mail fora do ar nao pode impedir alguem de criar conta.
      // A conta ja entra usavel; a verificacao e um segundo passo, nao um portao.
      void enviarVerificacaoDeEmail(url.origin, usuario);
    } catch (erro) {
      if (erro instanceof ErroDeAutenticacao || erro instanceof ErroDeValidacao) {
        return fail(400, { email, nome, mensagem: erro.message });
      }
      throw erro;
    }

    throw redirect(303, '/');
  }
};
