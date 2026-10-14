// Arquivo: src/lib/componentes/casca/itens-de-navegacao.ts
// Fonte unica das secoes. A barra inferior e a navegacao do topo leem daqui pra nunca
// divergirem uma da outra.

export interface ItemDeNavegacao {
  href: string;
  rotulo: string;
}

export const ITENS_DE_NAVEGACAO: ItemDeNavegacao[] = [
  { href: '/', rotulo: 'Início' },
  { href: '/catalogo', rotulo: 'Catálogo' },
  { href: '/novidades', rotulo: 'Novidades' },
  { href: '/generos', rotulo: 'Gêneros' },
  { href: '/minha-lista', rotulo: 'Minha Lista' }
];

export const ITENS_DA_BARRA_INFERIOR = [
  { href: '/', rotulo: 'Início', icone: 'casa' },
  { href: '/catalogo', rotulo: 'Catálogo', icone: 'grade-catalogo' },
  { href: '/novidades', rotulo: 'Novidades', icone: 'novidades-brilho' },
  { href: '/minha-lista', rotulo: 'Minha Lista', icone: 'marcador-lista' },
  { href: '/configuracoes', rotulo: 'Configurações', icone: 'engrenagem' }
] as const;

/** A home so acende em "/" exato; as outras acendem tambem nas subrotas. */
export function estaAtivo(caminhoAtual: string, href: string): boolean {
  if (href === '/') return caminhoAtual === '/';
  return caminhoAtual === href || caminhoAtual.startsWith(`${href}/`);
}
