// Arquivo: src/lib/servidor/banco/catalogo.ts
// Consultas do catalogo publico. Uma funcao por trilha da home pra cada uma poder
// mudar de criterio sem mexer nas outras.

import { banco } from './cliente.js';
import { paraCartao, paraDestaque, type TituloBruto } from './mapear-titulo.js';
import { contarAudienciaDeVariosTitulos } from './audiencia.js';
import type { CatalogoPublico, TrilhaDeConteudo } from './tipos-catalogo.js';

export const VERSAO_DO_CATALOGO = 1;

const INCLUSAO = {
  temporadas: { select: { numero: true } },
  generos: { select: { genero: { select: { nome: true } } } },
  avaliacoes: { select: { nota: true } }
} as const;

async function buscar(where: object, ordem: object, limite = 14): Promise<TituloBruto[]> {
  return banco.titulo.findMany({
    where: { situacao: 'PUBLICADO', ...where },
    orderBy: ordem,
    take: limite,
    include: INCLUSAO
  }) as unknown as Promise<TituloBruto[]>;
}

async function montarTrilha(
  chave: string,
  titulo: string,
  verMaisUrl: string,
  brutos: TituloBruto[]
): Promise<TrilhaDeConteudo> {
  const audiencia = await contarAudienciaDeVariosTitulos(brutos.map((t) => t.id));
  return {
    chave,
    titulo,
    verMaisUrl,
    itens: brutos.map((bruto) => paraCartao(bruto, audiencia.get(bruto.id) ?? 0))
  };
}

export async function montarCatalogoPublico(): Promise<CatalogoPublico> {
  const [destaques, populares, emAlta, novidades] = await Promise.all([
    buscar({ destaque: true }, { popularidade: 'desc' }, 5),
    buscar({}, { popularidade: 'desc' }),
    buscar({ emAlta: true }, { atualizadoEm: 'desc' }),
    buscar({ novidade: true }, { atualizadoEm: 'desc' })
  ]);

  const trilhas = await Promise.all([
    montarTrilha('populares', 'Populares', '/catalogo?ordem=populares', populares),
    montarTrilha('em-alta', 'Em alta', '/catalogo?ordem=em-alta', emAlta),
    montarTrilha('novidades', 'Novidades', '/novidades', novidades)
  ]);

  return {
    destaques: destaques.map(paraDestaque),
    trilhas,
    geradoEm: new Date().toISOString(),
    versao: VERSAO_DO_CATALOGO
  };
}

export async function listarCatalogoCompleto(genero?: string) {
  const brutos = await buscar(
    genero ? { generos: { some: { genero: { slug: genero } } } } : {},
    { nome: 'asc' },
    120
  );
  const audiencia = await contarAudienciaDeVariosTitulos(brutos.map((t) => t.id));
  return brutos.map((bruto) => paraCartao(bruto, audiencia.get(bruto.id) ?? 0));
}

export async function listarGeneros() {
  return banco.genero.findMany({ orderBy: { nome: 'asc' } });
}
