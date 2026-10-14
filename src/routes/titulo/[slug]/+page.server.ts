// Arquivo: src/routes/titulo/[slug]/+page.server.ts

import { error } from '@sveltejs/kit';
import { detalharTitulo, proximosEpisodios, recomendacoesPara } from '$servidor/banco/titulo';
import { idsNaLista } from '$servidor/banco/lista';
import { notaDoUsuario } from '$servidor/banco/avaliacao';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const detalhe = await detalharTitulo(params.slug);
  if (!detalhe) throw error(404, 'Título não encontrado.');

  const [recomendacoes, maisEpisodios, lista, minhaNota] = await Promise.all([
    recomendacoesPara(params.slug),
    proximosEpisodios(params.slug),
    locals.usuario ? idsNaLista(locals.usuario.id) : Promise.resolve([]),
    locals.usuario ? notaDoUsuario(locals.usuario.id, detalhe.destaque.id) : Promise.resolve(null)
  ]);

  return {
    ...detalhe,
    recomendacoes,
    maisEpisodios,
    naLista: lista.includes(detalhe.destaque.id),
    minhaNota
  };
};
