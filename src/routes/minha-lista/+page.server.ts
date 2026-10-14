// Arquivo: src/routes/minha-lista/+page.server.ts
// Sem sessao nao ha lista: devolvo vazio e a pagina convida a entrar (nao quebra).

import { listarMinhaLista } from '$servidor/banco/lista';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.usuario) return { itens: [], precisaEntrar: true };
  return { itens: await listarMinhaLista(locals.usuario.id), precisaEntrar: false };
};
