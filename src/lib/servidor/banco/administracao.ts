// Arquivo: src/lib/servidor/banco/administracao.ts
// Escritas do painel sobre CONTEUDO: titulos, temporadas e episodios.
// Pessoas (usuarios, papeis, denuncias, registro) ficam em administracao-pessoas.ts —
// eixos diferentes, e junto o arquivo passava das 180 linhas.
//
// Rota nao fala com Prisma direto: assim a regra de "quem pode o que" fica na rota
// e a forma dos dados fica aqui.

import { banco } from './cliente.js';
import type { SituacaoTitulo, TipoDeTitulo } from './gerado/enums.js';

export class ErroDeAdministracao extends Error {}

export interface DadosDeTitulo {
  slug: string;
  nome: string;
  sinopse: string;
  ano: number;
  classificacao: string;
  tipo: TipoDeTitulo;
  situacao: SituacaoTitulo;
  destaque: boolean;
  novidade: boolean;
  emAlta: boolean;
  popularidade: number;
}

export async function listarTitulosDoPainel(busca?: string) {
  return banco.titulo.findMany({
    where: busca ? { nome: { contains: busca } } : undefined,
    orderBy: { atualizadoEm: 'desc' },
    take: 100,
    select: {
      id: true,
      slug: true,
      nome: true,
      ano: true,
      situacao: true,
      destaque: true,
      atualizadoEm: true,
      _count: { select: { temporadas: true } }
    }
  });
}

export async function lerTituloDoPainel(id: string) {
  return banco.titulo.findUnique({
    where: { id },
    include: {
      generos: { select: { generoId: true } },
      temporadas: {
        orderBy: { numero: 'asc' },
        include: {
          episodios: {
            orderBy: { numero: 'asc' },
            select: {
              id: true,
              numero: true,
              nome: true,
              duracaoSegundos: true,
              publicadoEm: true,
              miniaturaUrl: true,
              _count: { select: { arquivos: true } }
            }
          }
        }
      }
    }
  });
}

async function garantirSlugLivre(slug: string, exceto?: string): Promise<void> {
  const existente = await banco.titulo.findUnique({ where: { slug }, select: { id: true } });
  if (existente && existente.id !== exceto) {
    throw new ErroDeAdministracao('Ja existe um titulo com este slug.');
  }
}

export async function criarTitulo(dados: DadosDeTitulo, generoIds: string[]) {
  await garantirSlugLivre(dados.slug);

  const criado = await banco.titulo.create({
    data: {
      ...dados,
      generos: { create: generoIds.map((generoId) => ({ generoId })) }
    }
  });

  // Filme e uma peca so, mas o banco guarda todo video dentro de temporada/episodio.
  // A estrutura nasce junto pra quem cadastra nao ter que criar "temporada 1" pra um
  // filme — que era justamente o passo que fazia o painel mentir sobre o modelo.
  if (criado.tipo === 'FILME') {
    const temporada = await banco.temporada.create({
      data: { tituloId: criado.id, numero: 1, nome: criado.nome }
    });
    await banco.episodio.create({
      data: { temporadaId: temporada.id, numero: 1, nome: criado.nome, duracaoSegundos: 0 }
    });
  }

  return criado;
}

export async function atualizarTitulo(id: string, dados: DadosDeTitulo, generoIds: string[]) {
  await garantirSlugLivre(dados.slug, id);
  // Trocar o conjunto inteiro em vez de calcular diferenca: sao poucos generos por
  // titulo e o calculo erraria mais do que economizaria.
  return banco.$transaction([
    banco.tituloGenero.deleteMany({ where: { tituloId: id } }),
    banco.titulo.update({
      data: { ...dados, generos: { create: generoIds.map((generoId) => ({ generoId })) } },
      where: { id }
    })
  ]);
}

export async function criarTemporada(tituloId: string, numero: number, nome: string) {
  const jaExiste = await banco.temporada.findUnique({
    where: { tituloId_numero: { tituloId, numero } },
    select: { id: true }
  });
  if (jaExiste) throw new ErroDeAdministracao(`A temporada ${numero} ja existe neste titulo.`);

  return banco.temporada.create({ data: { tituloId, numero, nome } });
}

export async function criarEpisodio(
  temporadaId: string,
  numero: number,
  nome: string,
  duracaoSegundos: number,
  publicadoEm?: Date
) {
  const jaExiste = await banco.episodio.findFirst({
    where: { temporadaId, numero },
    select: { id: true }
  });
  if (jaExiste) throw new ErroDeAdministracao(`O episodio ${numero} ja existe nesta temporada.`);

  // Sem data, o banco poe now() e o episodio nasce no ar. Com data no futuro, ele
  // fica invisivel pro publico ate a hora — antes cadastrar uma temporada estreava
  // os doze episodios de uma vez.
  return banco.episodio.create({
    data: { temporadaId, numero, nome, duracaoSegundos, publicadoEm }
  });
}

/** Capa do titulo: `poster` e a vertical dos cards, `hero` e a arte deitada do topo. */
export async function definirCapaDoTitulo(id: string, alvo: 'poster' | 'hero', url: string) {
  return banco.titulo.update({
    where: { id },
    data: alvo === 'poster' ? { posterUrl: url } : { arteHeroUrl: url }
  });
}

export async function definirMiniaturaDoEpisodio(id: string, url: string) {
  return banco.episodio.update({ where: { id }, data: { miniaturaUrl: url } });
}

export async function atualizarEpisodio(
  id: string,
  numero: number,
  nome: string,
  duracaoSegundos: number,
  publicadoEm?: Date
) {
  // `publicadoEm` indefinido nao zera a data: no Prisma, campo ausente em `data`
  // fica como esta. Quem quiser antecipar a estreia escolhe uma data no passado.
  return banco.episodio.update({
    data: { numero, nome, duracaoSegundos, publicadoEm },
    where: { id }
  });
}
