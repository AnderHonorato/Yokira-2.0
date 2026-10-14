// Arquivo: src/routes/novidades/+page.server.ts

import { montarCatalogoPublico } from '$servidor/banco/catalogo';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const catalogo = await montarCatalogoPublico();
  const trilha = catalogo.trilhas.find((item) => item.chave === 'novidades');
  return { itens: trilha?.itens ?? [] };
};
