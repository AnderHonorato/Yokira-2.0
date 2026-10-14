// Arquivo: src/lib/validacoes/tema.ts
// Preferencia de tema. Fica em validacoes/ porque cliente e servidor precisam da
// mesma lista: a tela oferece as opcoes e o servidor recusa qualquer outra coisa.

export const TEMAS = ['automatico', 'claro', 'escuro'] as const;
export type Tema = (typeof TEMAS)[number];

/** Escuro e a apresentacao principal da marca; e ele que vale quando nada foi escolhido. */
export const TEMA_PADRAO: Tema = 'escuro';

export const NOME_COOKIE_TEMA = 'yokira_tema';

export const ROTULO_DO_TEMA: Record<Tema, string> = {
  automatico: 'Automático',
  claro: 'Claro',
  escuro: 'Escuro'
};

export const DESCRICAO_DO_TEMA: Record<Tema, string> = {
  automatico: 'Segue a configuração do seu aparelho.',
  claro: 'Fundo claro, sempre.',
  escuro: 'Fundo escuro, sempre. É como a marca se apresenta.'
};

export function normalizarTema(valor: unknown): Tema {
  return TEMAS.includes(valor as Tema) ? (valor as Tema) : TEMA_PADRAO;
}

/** Cor da barra do navegador. No automatico saem duas, cada uma com sua media query. */
export function metaDeTema(tema: Tema): string {
  const escuro =
    '<meta name="theme-color" content="#08080b" media="(prefers-color-scheme: dark)" />';
  const claro =
    '<meta name="theme-color" content="#f4f4f7" media="(prefers-color-scheme: light)" />';

  if (tema === 'automatico') return `${escuro}\n    ${claro}`;
  return tema === 'claro'
    ? '<meta name="theme-color" content="#f4f4f7" />'
    : '<meta name="theme-color" content="#08080b" />';
}
