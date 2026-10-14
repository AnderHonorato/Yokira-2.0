// Arquivo: src/routes/recuperar-senha/+page.server.ts
// Pede o e-mail e manda o link. A resposta e SEMPRE a mesma, exista a conta ou nao:
// tela diferente pra e-mail cadastrado transformaria esta pagina num oraculo de contas.

import { fail, redirect } from '@sveltejs/kit';
import { enviarRecuperacaoDeSenha } from '$servidor/email/fluxos-de-conta';
import { validarEmail } from '$lib/validacoes/conta';
import { ErroDeValidacao } from '$lib/validacoes/erro-validacao';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.usuario) throw redirect(303, '/configuracoes');
  return {};
};

export const actions: Actions = {
  default: async ({ request, url }) => {
    const formulario = await request.formData();
    const email = String(formulario.get('email') ?? '');

    let normalizado: string;
    try {
      normalizado = validarEmail(email);
    } catch (erro) {
      if (erro instanceof ErroDeValidacao) return fail(400, { email, mensagem: erro.message });
      throw erro;
    }

    await enviarRecuperacaoDeSenha(url.origin, normalizado);

    return { enviado: true, email: normalizado };
  }
};
