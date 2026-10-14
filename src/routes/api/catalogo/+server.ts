// Arquivo: src/routes/api/catalogo/+server.ts
// Catalogo publico em JSON. E daqui que o pre-carregamento e o service worker se alimentam.

import { json } from '@sveltejs/kit';
import { montarCatalogoPublico } from '$servidor/banco/catalogo';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ setHeaders }) => {
  const catalogo = await montarCatalogoPublico();

  // 5 min de frescor + 6h servindo velho enquanto revalida: casa com a validade do IndexedDB.
  setHeaders({ 'cache-control': 'public, max-age=300, stale-while-revalidate=21600' });

  return json(catalogo);
};
