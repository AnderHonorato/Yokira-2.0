// Arquivo: src/lib/servidor/banco/titulo.ts
// Pagina de detalhes: titulo + temporadas + episodios + trailers + recomendacoes.

import { banco } from './cliente.js';
import { jaEstreou } from './estreia.js';
import { calcularNota, paraCartao, paraDestaque, type TituloBruto } from './mapear-titulo.js';
import { posterEmDataUri } from '../../visual/posters/gerar-poster.js';

const INCLUSAO_CARTAO = {
  temporadas: { select: { numero: true } },
  generos: { select: { genero: { select: { nome: true } } } },
  avaliacoes: { select: { nota: true } }
} as const;

export async function detalharTitulo(slug: string) {
  // Episodio agendado nao aparece na lista: ele ainda nao existe pra quem assiste.
  const noAr = jaEstreou();
  const titulo = await banco.titulo.findUnique({
    where: { slug },
    include: {
      ...INCLUSAO_CARTAO,
      temporadas: {
        orderBy: { numero: 'asc' },
        include: { episodios: { where: noAr, orderBy: { numero: 'asc' } } }
      }
    }
  });
  if (!titulo) return null;

  const bruto = titulo as unknown as TituloBruto;

  return {
    destaque: paraDestaque(bruto),
    nota: calcularNota(bruto.avaliacoes),
    temporadas: titulo.temporadas.map((temporada) => ({
      id: temporada.id,
      numero: temporada.numero,
      nome: temporada.nome,
      episodios: temporada.episodios.map((episodio) => ({
        id: episodio.id,
        numero: episodio.numero,
        nome: episodio.nome,
        duracaoMinutos: Math.round(episodio.duracaoSegundos / 60),
        miniatura:
          episodio.miniaturaUrl ??
          posterEmDataUri(`${slug}-${episodio.id}`, `EP ${episodio.numero}`)
      }))
    }))
  };
}

export async function recomendacoesPara(slug: string, limite = 8) {
  const atual = await banco.titulo.findUnique({
    where: { slug },
    select: { id: true, generos: { select: { generoId: true } } }
  });
  if (!atual) return [];

  const brutos = (await banco.titulo.findMany({
    where: {
      situacao: 'PUBLICADO',
      id: { not: atual.id },
      generos: { some: { generoId: { in: atual.generos.map((g) => g.generoId) } } }
    },
    orderBy: { popularidade: 'desc' },
    take: limite,
    include: INCLUSAO_CARTAO
  })) as unknown as TituloBruto[];

  return brutos.map((bruto) => paraCartao(bruto));
}

export async function proximosEpisodios(slug: string, limite = 3) {
  const episodios = await banco.episodio.findMany({
    where: { temporada: { titulo: { slug } }, ...jaEstreou() },
    orderBy: [{ temporada: { numero: 'desc' } }, { numero: 'desc' }],
    take: limite,
    include: { temporada: { select: { numero: true } } }
  });

  return episodios.map((episodio) => ({
    id: episodio.id,
    numero: episodio.numero,
    nome: episodio.nome,
    duracaoMinutos: Math.round(episodio.duracaoSegundos / 60),
    miniatura:
      episodio.miniaturaUrl ??
      posterEmDataUri(`${slug}-mais-${episodio.id}`, `EP ${episodio.numero}`)
  }));
}
