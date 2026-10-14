// Arquivo: src/lib/validacoes/administracao.ts
// Regras dos formularios do painel. Mesmo arquivo no cliente e no servidor, como em
// validacoes/conta.ts: a mensagem que aparece na tela e a que o servidor aplicaria.

import { ErroDeValidacao, exigirInteiro, exigirTexto } from './erro-validacao.js';

export const SITUACOES_DE_TITULO = ['RASCUNHO', 'PUBLICADO', 'DESPUBLICADO'] as const;
export const PAPEIS = ['ESPECTADOR', 'EDITOR', 'MODERADOR', 'ADMINISTRADOR'] as const;
export const TIPOS_DE_TITULO = ['SERIE', 'FILME'] as const;
export const CLASSIFICACOES = ['L', '10', '12', '14', '16', '18'] as const;

export type SituacaoDeTitulo = (typeof SITUACOES_DE_TITULO)[number];
export type PapelValidado = (typeof PAPEIS)[number];
export type TipoValidado = (typeof TIPOS_DE_TITULO)[number];

const FORMATO_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ANO_MINIMO = 1900;

/** Sugestao de slug a partir do nome. Quem edita ainda pode trocar na mao. */
export function sugerirSlug(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function validarSlug(valor: unknown): string {
  const slug = exigirTexto(valor, 'slug', 80).toLowerCase();
  if (!FORMATO_SLUG.test(slug)) {
    throw new ErroDeValidacao(
      'slug',
      'O slug aceita apenas letras minusculas, numeros e hifen entre palavras.'
    );
  }
  return slug;
}

export function validarNomeDeTitulo(valor: unknown): string {
  return exigirTexto(valor, 'nome', 120);
}

export function validarSinopse(valor: unknown): string {
  const sinopse = exigirTexto(valor, 'sinopse', 2000);
  if (sinopse.length < 20) {
    throw new ErroDeValidacao('sinopse', 'A sinopse esta curta demais (minimo 20 caracteres).');
  }
  return sinopse;
}

export function validarAno(valor: unknown): number {
  // Um ano a frente cobre titulo anunciado que ainda nao estreou.
  return exigirInteiro(valor, 'ano', ANO_MINIMO, new Date().getFullYear() + 1);
}

export function validarClassificacao(valor: unknown): string {
  const texto = exigirTexto(valor, 'classificacao', 3).toUpperCase();
  if (!CLASSIFICACOES.includes(texto as (typeof CLASSIFICACOES)[number])) {
    throw new ErroDeValidacao('classificacao', 'Classificacao fora da lista permitida.');
  }
  return texto;
}

export function validarSituacao(valor: unknown): SituacaoDeTitulo {
  const texto = exigirTexto(valor, 'situacao', 20).toUpperCase();
  if (!SITUACOES_DE_TITULO.includes(texto as SituacaoDeTitulo)) {
    throw new ErroDeValidacao('situacao', 'Situacao desconhecida.');
  }
  return texto as SituacaoDeTitulo;
}

export function validarPapel(valor: unknown): PapelValidado {
  const texto = exigirTexto(valor, 'papel', 20).toUpperCase();
  if (!PAPEIS.includes(texto as PapelValidado)) {
    throw new ErroDeValidacao('papel', 'Papel desconhecido.');
  }
  return texto as PapelValidado;
}

export function validarTipoDeTitulo(valor: unknown): TipoValidado {
  const texto = exigirTexto(valor, 'tipo', 10).toUpperCase();
  if (!TIPOS_DE_TITULO.includes(texto as TipoValidado)) {
    throw new ErroDeValidacao('tipo', 'Tipo de titulo desconhecido.');
  }
  return texto as TipoValidado;
}

export function validarNumeroDeTemporada(valor: unknown): number {
  return exigirInteiro(valor, 'numero', 1, 99);
}

export function validarNumeroDeEpisodio(valor: unknown): number {
  return exigirInteiro(valor, 'numero', 1, 9999);
}

export function validarDuracaoEmMinutos(valor: unknown): number {
  return exigirInteiro(valor, 'duracao', 1, 600);
}

/**
 * Data de estreia do episodio. Vazio significa "ja no ar" — o banco poe now().
 * O <input type="datetime-local"> manda "2026-09-01T20:00", sem fuso: a norma manda
 * ler isso como hora local, que e a hora que quem agendou digitou.
 */
export function validarDataDeEstreia(valor: unknown): Date | undefined {
  if (valor === null || valor === undefined) return undefined;

  const texto = String(valor).trim();
  if (texto === '') return undefined;

  const data = new Date(texto);
  if (Number.isNaN(data.getTime())) {
    throw new ErroDeValidacao('estreia', 'Data de estreia invalida.');
  }

  return data;
}

export function validarPopularidade(valor: unknown): number {
  return exigirInteiro(valor, 'popularidade', 0, 1_000_000);
}

/**
 * Le os campos do titulo do formulario. Criar e editar pedem exatamente os mesmos, e
 * ter isso escrito em dois arquivos foi como o campo `tipo` quase entrou so num deles.
 */
export function lerDadosDeTitulo(formulario: FormData) {
  const nome = validarNomeDeTitulo(formulario.get('nome'));

  return {
    nome,
    // Slug em branco vira sugestao a partir do nome: um campo a menos pra errar.
    slug: validarSlug(String(formulario.get('slug') ?? '').trim() || sugerirSlug(nome)),
    sinopse: validarSinopse(formulario.get('sinopse')),
    ano: validarAno(formulario.get('ano')),
    classificacao: validarClassificacao(formulario.get('classificacao')),
    tipo: validarTipoDeTitulo(formulario.get('tipo') ?? 'SERIE'),
    situacao: validarSituacao(formulario.get('situacao')),
    destaque: formulario.get('destaque') === 'on',
    novidade: formulario.get('novidade') === 'on',
    emAlta: formulario.get('emAlta') === 'on',
    // O formulario de criacao nao tem o campo: titulo novo comeca com popularidade zero.
    popularidade: validarPopularidade(formulario.get('popularidade') ?? 0)
  };
}
