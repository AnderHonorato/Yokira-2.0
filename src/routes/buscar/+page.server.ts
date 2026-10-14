// Arquivo: src/routes/buscar/+page.server.ts
// Busca simples por nome. SQLite sem full-text aqui: `contains` resolve pro tamanho atual
// do catalogo e evita carregar uma extensao so pra isso.

import { listarCatalogoCompleto } from '$servidor/banco/catalogo';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
  const termo = (url.searchParams.get('q') ?? '').trim();
  if (termo.length < 2) return { termo, itens: [] };

  const todos = await listarCatalogoCompleto();
  const alvo = termo.toLowerCase();
  return { termo, itens: todos.filter((item) => item.nome.toLowerCase().includes(alvo)) };
};
