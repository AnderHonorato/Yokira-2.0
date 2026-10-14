// Arquivo: src/lib/servidor/banco/ranking.ts
// Ranking "Pegando fogo": visualizacao vale 1, curtida 4, comentario 6 e atividade
// das ultimas 48h recebe bonus. A pontuacao fica materializada no titulo para a home
// ordenar sem fazer agregacoes pesadas a cada request.

import { banco } from './cliente.js';
import { contarVisualizacoesRecentesDeTitulo } from './consumo.js';

const DIA = 24 * 60 * 60_000;

async function contarInteracoes(tituloId: string, desde: Date) {
  const alvoEpisodios = { episodio: { temporada: { tituloId } } };
  const [curtidasTitulo, curtidasEpisodios, comentarios] = await Promise.all([
    banco.curtidaTitulo.count({ where: { tituloId, criadoEm: { gte: desde } } }),
    banco.curtidaEpisodio.count({ where: { criadoEm: { gte: desde }, ...alvoEpisodios } }),
    banco.comentario.count({
      where: {
        situacao: 'PUBLICADO',
        criadoEm: { gte: desde },
        OR: [{ tituloId }, alvoEpisodios]
      }
    })
  ]);
  return { curtidas: curtidasTitulo + curtidasEpisodios, comentarios };
}

export async function calcularPontuacaoEmAlta(tituloId: string): Promise<number> {
  const agora = Date.now();
  const desde7Dias = new Date(agora - 7 * DIA);
  const desde48h = new Date(agora - 2 * DIA);

  const [visualizacoes, interacoes, visualizacoesRecentes, interacoesRecentes] = await Promise.all([
    contarVisualizacoesRecentesDeTitulo(tituloId, desde7Dias),
    contarInteracoes(tituloId, desde7Dias),
    contarVisualizacoesRecentesDeTitulo(tituloId, desde48h),
    contarInteracoes(tituloId, desde48h)
  ]);

  const base = visualizacoes + interacoes.curtidas * 4 + interacoes.comentarios * 6;
  const recente =
    visualizacoesRecentes * 0.75 +
    interacoesRecentes.curtidas * 2 +
    interacoesRecentes.comentarios * 3;
  return Math.round((base + recente) * 100) / 100;
}

export async function atualizarRankingDoTitulo(tituloId: string): Promise<number> {
  const pontuacao = await calcularPontuacaoEmAlta(tituloId);
  await banco.titulo.update({
    where: { id: tituloId },
    data: {
      pontuacaoEmAlta: pontuacao,
      emAlta: pontuacao >= 4,
      rankingAtualizadoEm: new Date()
    }
  });
  return pontuacao;
}

export async function atualizarRankingPorEpisodio(episodioId: string): Promise<number | null> {
  const episodio = await banco.episodio.findUnique({
    where: { id: episodioId },
    select: { temporada: { select: { tituloId: true } } }
  });
  return episodio ? atualizarRankingDoTitulo(episodio.temporada.tituloId) : null;
}

export async function recalcularRankingGlobal(): Promise<number> {
  const titulos = await banco.titulo.findMany({
    where: { situacao: 'PUBLICADO' },
    select: { id: true }
  });
  for (const titulo of titulos) await atualizarRankingDoTitulo(titulo.id);
  return titulos.length;
}
