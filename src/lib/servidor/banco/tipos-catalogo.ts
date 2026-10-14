// Arquivo: src/lib/servidor/banco/tipos-catalogo.ts
// Formato que sai do servidor e entra nos componentes. Fica separado do Prisma pra
// interface nunca depender do shape do ORM (e pra poder cachear no IndexedDB sem surpresa).

export interface CartaoDeTitulo {
  id: string;
  slug: string;
  nome: string;
  ano: number;
  nota: number | null;
  poster: string;
  classificacao: string;
  novidade: boolean;
  temporadas: number;
  ehFilme: boolean;
  rotuloSecundario: string;
  assistindoAgora: number;
  sinopseCurta: string;
}

export interface TrilhaDeConteudo {
  chave: string;
  titulo: string;
  verMaisUrl: string;
  itens: CartaoDeTitulo[];
}

export interface DestaqueDoHero {
  id: string;
  slug: string;
  nome: string;
  sinopse: string;
  ano: number;
  classificacao: string;
  generos: string[];
  temporadas: number;
  ehFilme: boolean;
  arte: string;
  novidade: boolean;
  chamadaGratuita: string;
}

export interface CatalogoPublico {
  destaques: DestaqueDoHero[];
  trilhas: TrilhaDeConteudo[];
  geradoEm: string;
  versao: number;
}
