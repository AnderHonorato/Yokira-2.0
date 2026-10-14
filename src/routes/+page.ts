// Arquivo: src/routes/+page.ts
// Home carregada por um `load` universal: no servidor busca direto (o fetch do
// SvelteKit resolve o endpoint interno sem sair pela rede, entao o HTML continua
// chegando pintado); no navegador le o IndexedDB primeiro e revalida atras.
//
// Era aqui que estava a espera: com `+page.server.ts` toda navegacao de cliente
// parava no round-trip do `__data.json` antes de pintar qualquer coisa.

import { browser } from '$app/environment';
import { carregarComCache } from '$cliente/carga-instantanea';
import { CHAVE_DO_CATALOGO, VALIDADE_DO_CATALOGO_MS } from '$cliente/precarregamento';
import type { CatalogoPublico } from '$servidor/banco/tipos-catalogo';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, setHeaders }) => {
  const buscar = async (): Promise<CatalogoPublico> => {
    const resposta = await fetch('/api/catalogo', { headers: { accept: 'application/json' } });
    if (!resposta.ok) throw new Error('Catálogo indisponível');
    return (await resposta.json()) as CatalogoPublico;
  };

  if (!browser) {
    setHeaders({ 'cache-control': 'private, max-age=30' });
    return { catalogo: await buscar(), atualizacao: null };
  }

  const carga = await carregarComCache<CatalogoPublico>({
    chave: CHAVE_DO_CATALOGO,
    validadeMs: VALIDADE_DO_CATALOGO_MS,
    buscar,
    // `geradoEm` muda a cada resposta; comparar com ele trocaria o objeto sempre
    // e reiniciaria o hero rotativo sem motivo.
    ignorar: ['geradoEm']
  });

  return { catalogo: carga.valor, atualizacao: carga.atualizacao };
};
