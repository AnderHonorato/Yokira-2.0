// Arquivo: src/routes/admin/denuncias/+page.server.ts
// Denuncias. Exige MODERADOR: e o papel que existe justamente pra isso.

import { fail } from '@sveltejs/kit';
import { listarDenuncias, marcarDenuncia } from '$servidor/banco/administracao-pessoas';
import { registrarAcaoAdministrativa } from '$servidor/autenticacao/confirmacao';
import { exigirPapel } from '$servidor/permissoes/papeis';
import { ErroDeValidacao, exigirTexto } from '$lib/validacoes/erro-validacao';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
  exigirPapel(locals.usuario?.papel, 'MODERADOR');

  const resolvidas = url.searchParams.get('resolvidas') === '1';
  return { denuncias: await listarDenuncias(resolvidas), resolvidas };
};

export const actions: Actions = {
  // Resolver nao apaga nada, entao nao passa pela dupla confirmacao — e reversivel
  // pelo proprio botao de reabrir.
  alternar: async ({ request, locals }) => {
    exigirPapel(locals.usuario?.papel, 'MODERADOR');
    const formulario = await request.formData();

    try {
      const id = exigirTexto(formulario.get('id'), 'id', 60);
      const resolvida = formulario.get('resolvida') === '1';
      await marcarDenuncia(id, resolvida);
      await registrarAcaoAdministrativa(
        locals.usuario!.id,
        resolvida ? 'resolver-denuncia' : 'reabrir-denuncia',
        id
      );
      return { mensagem: resolvida ? 'Denúncia resolvida.' : 'Denúncia reaberta.' };
    } catch (erro) {
      if (erro instanceof ErroDeValidacao) return fail(400, { mensagem: erro.message });
      throw erro;
    }
  }
};
