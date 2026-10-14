// Arquivo: prisma/seed.ts
// Popula o banco com o catalogo ficticio + contas de demonstracao.
// Idempotente: pode rodar de novo sem duplicar nada.

import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../src/lib/servidor/banco/gerado/client.js';
import { GENEROS, NOMES_DE_EPISODIO, TITULOS } from './dados-ficticios.js';
import { garantirVotantes, semearContas } from './contas-de-demonstracao.js';
import { semear } from '../src/lib/visual/posters/gerar-poster.js';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? 'file:./dev.db' });
const banco = new PrismaClient({ adapter });

async function semearGeneros(): Promise<Map<string, string>> {
  const mapa = new Map<string, string>();
  for (const nome of GENEROS) {
    const slug = paraSlug(nome);
    const genero = await banco.genero.upsert({
      where: { slug },
      create: { nome, slug },
      update: { nome }
    });
    mapa.set(nome, genero.id);
  }
  return mapa;
}

async function semearTitulos(generos: Map<string, string>): Promise<void> {
  for (const ficticio of TITULOS) {
    const titulo = await banco.titulo.upsert({
      where: { slug: ficticio.slug },
      create: {
        slug: ficticio.slug,
        nome: ficticio.nome,
        sinopse: ficticio.sinopse,
        ano: ficticio.ano,
        classificacao: ficticio.classificacao,
        destaque: ficticio.destaque ?? false,
        novidade: ficticio.novidade ?? false,
        emAlta: ficticio.emAlta ?? false,
        popularidade: ficticio.popularidade
      },
      update: { popularidade: ficticio.popularidade }
    });

    await ligarGeneros(titulo.id, ficticio.generos, generos);
    await semearTemporadas(titulo.id, ficticio.temporadas, ficticio.episodiosPorTemporada);
  }
}

async function ligarGeneros(
  tituloId: string,
  nomes: string[],
  generos: Map<string, string>
): Promise<void> {
  for (const nome of nomes) {
    const generoId = generos.get(nome);
    if (!generoId) continue;
    await banco.tituloGenero.upsert({
      where: { tituloId_generoId: { tituloId, generoId } },
      create: { tituloId, generoId },
      update: {}
    });
  }
}

async function semearTemporadas(
  tituloId: string,
  quantidade: number,
  episodiosPorTemporada: number
): Promise<void> {
  for (let numero = 1; numero <= quantidade; numero += 1) {
    const temporada = await banco.temporada.upsert({
      where: { tituloId_numero: { tituloId, numero } },
      create: { tituloId, numero, nome: `Temporada ${numero}` },
      update: {}
    });

    for (let episodio = 1; episodio <= episodiosPorTemporada; episodio += 1) {
      await banco.episodio.upsert({
        where: { temporadaId_numero: { temporadaId: temporada.id, numero: episodio } },
        create: {
          temporadaId: temporada.id,
          numero: episodio,
          nome: NOMES_DE_EPISODIO[(episodio - 1) % NOMES_DE_EPISODIO.length],
          duracaoSegundos: 23 * 60
        },
        update: {}
      });
    }
  }
}

async function semearAvaliacoes(): Promise<void> {
  const titulos = await banco.titulo.findMany({ select: { id: true, slug: true } });

  // Varias avaliacoes por titulo em vez de uma so: com um voto unico toda nota saia
  // inteira (9.0, 10.0) e a tela ficava com o mesmo numero repetido em tudo.
  const votantes = await garantirVotantes(banco);

  for (const titulo of titulos) {
    const base = TITULOS.find((ficticio) => ficticio.slug === titulo.slug)?.popularidade ?? 800;
    for (const [posicao, votante] of votantes.entries()) {
      // Hash de (slug + votante). A versao anterior somava uma permutacao fixa de
      // -2..2, entao a media caia sempre no mesmo lugar e a tela ficava com a nota
      // repetida em todos os titulos.
      const variacao = (semear(`${titulo.slug}:${posicao}`) % 5) - 2;
      const nota = Math.max(6, Math.min(10, Math.round(base / 108) + variacao));
      await banco.avaliacao.upsert({
        where: { usuarioId_tituloId: { usuarioId: votante, tituloId: titulo.id } },
        create: { usuarioId: votante, tituloId: titulo.id, nota },
        update: { nota }
      });
    }
  }
}

function paraSlug(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const generos = await semearGeneros();
await semearTitulos(generos);
await semearContas(banco);
await semearAvaliacoes();
console.log('Seed concluido: catalogo ficticio + contas de demonstracao.');
await banco.$disconnect();
