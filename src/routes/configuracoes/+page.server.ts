// Arquivo: src/routes/configuracoes/+page.server.ts
// Visitante tambem entra aqui: o tema e preferencia do aparelho, nao da conta, e a
// barra inferior ja aponta pra ca pra todo mundo. Sem conta, so a aparencia aparece.

import { dev } from '$app/environment';
import { fail, redirect } from '@sveltejs/kit';
import { banco } from '$servidor/banco/cliente';
import { enviarVerificacaoDeEmail } from '$servidor/email/fluxos-de-conta';
import { NOME_COOKIE_TEMA, normalizarTema } from '$lib/validacoes/tema';
import type { Actions, PageServerLoad } from './$types';

const UM_ANO_EM_SEGUNDOS = 60 * 60 * 24 * 365;

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.usuario) {
    return { tema: locals.tema, sessoesAtivas: 0, email: null, emailVerificado: false };
  }

  const [sessoesAtivas, conta] = await Promise.all([
    banco.sessao.count({
      where: { usuarioId: locals.usuario.id, revogadaEm: null, expiraEm: { gt: new Date() } }
    }),
    banco.usuario.findUnique({
      where: { id: locals.usuario.id },
      select: { emailVerificado: true, email: true }
    })
  ]);

  return {
    tema: locals.tema,
    sessoesAtivas,
    email: conta?.email ?? locals.usuario.email,
    emailVerificado: conta?.emailVerificado ?? false
  };
};

export const actions: Actions = {
  tema: async ({ request, cookies }) => {
    const formulario = await request.formData();
    const tema = normalizarTema(formulario.get('tema'));

    // httpOnly: quem le o cookie e o servidor, na hora de montar o HTML. O
    // navegador nao precisa ler — o componente troca o atributo direto.
    cookies.set(NOME_COOKIE_TEMA, tema, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: !dev,
      maxAge: UM_ANO_EM_SEGUNDOS
    });

    return { tema };
  },

  reenviarVerificacao: async ({ locals, url }) => {
    if (!locals.usuario) throw redirect(303, '/entrar');

    const enviado = await enviarVerificacaoDeEmail(url.origin, locals.usuario);
    if (!enviado) {
      return fail(502, { mensagemVerificacao: 'Não foi possível enviar agora. Tente mais tarde.' });
    }

    return { mensagemVerificacao: 'Link de confirmação enviado para o seu e-mail.' };
  }
};
