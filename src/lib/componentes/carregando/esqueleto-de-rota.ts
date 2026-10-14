// Arquivo: src/lib/componentes/carregando/esqueleto-de-rota.ts
// Escolhe o esqueleto pela rota de destino, e repete a estrutura que vai chegar.
// Funcao pura pra dar pra testar o mapeamento sem montar componente nenhum.

export type TipoDeEsqueleto = 'home' | 'grade' | 'detalhes' | 'player' | 'painel' | 'generico';

/** Rotas que desenham a mesma grade de cards de `grade-titulos.css`. */
const ROTAS_EM_GRADE = ['/catalogo', '/novidades', '/generos', '/minha-lista', '/buscar'];

function dentroDe(caminho: string, raiz: string): boolean {
  return caminho === raiz || caminho.startsWith(`${raiz}/`);
}

export function esqueletoDaRota(caminho: string): TipoDeEsqueleto {
  if (caminho === '/') return 'home';
  if (caminho.startsWith('/titulo/')) return 'detalhes';
  if (caminho.startsWith('/assistir/')) return 'player';
  if (dentroDe(caminho, '/admin')) return 'painel';
  if (ROTAS_EM_GRADE.some((rota) => dentroDe(caminho, rota))) return 'grade';
  return 'generico';
}

/** Indices pra repetir placeholder. `Array(n)` cru vem cheio de buraco e nao itera. */
export function repetir(quantidade: number): number[] {
  const indices: number[] = [];
  for (let indice = 0; indice < quantidade; indice += 1) indices.push(indice);
  return indices;
}
