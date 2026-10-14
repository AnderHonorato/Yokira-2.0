// Arquivo: src/routes/api/catalogo/completo/+server.ts
// Catalogo em grade (com filtro de genero) em JSON. E daqui que o `+page.ts` do
// /catalogo se alimenta pra poder cachear no IndexedDB e pintar sem esperar o servidor.

import { json } from '@sveltejs/kit';
import { listarCatalogoCompleto, listarGeneros } from '$servidor/banco/catalogo';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, setHeaders }) => {
  const genero = url.searchParams.get('genero') ?? undefined;
  const [itens, generos] = await Promise.all([listarCatalogoCompleto(genero), listarGeneros()]);

  // Mesma politica do /api/catalogo: 5 min de frescor e 6h servindo velho enquanto
  // revalida, casando com a validade do IndexedDB.
  setHeaders({ 'cache-control': 'public, max-age=300, stale-while-revalidate=21600' });

  return json({
    itens,
    generos,
    generoAtivo: genero ?? null,
    geradoEm: new Date().toISOString()
  });
};
