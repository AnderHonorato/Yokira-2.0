// Arquivo: src/lib/servidor/banco/consumo.ts
// Heatmap real: uma sessao por episodio/usuario-ou-navegador/dia e no maximo um registro
// por minuto assistido. Heartbeats repetidos nao aumentam artificialmente a audiencia.

import { createHash } from 'node:crypto';
import { banco } from './cliente.js';

const SEGUNDOS_POR_INTERVALO = 60;
const MAXIMO_SEGUNDOS = 24 * 60 * 60;

function inicioDoDiaUtc(): Date {
  const agora = new Date();
  return new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate()));
}

function chaveProtegida(chave: string, usuarioId?: string): string {
  const origem = usuarioId ? `usuario:${usuarioId}` : `anonimo:${chave.slice(0, 160)}`;
  return createHash('sha256').update(origem).digest('hex');
}

export function normalizarSegundoDeConsumo(valor: unknown): number {
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero < 0) return 0;
  return Math.min(MAXIMO_SEGUNDOS, Math.floor(numero));
}

export function inicioDoIntervalo(segundo: number): number {
  return Math.floor(normalizarSegundoDeConsumo(segundo) / SEGUNDOS_POR_INTERVALO) * SEGUNDOS_POR_INTERVALO;
}

export async function registrarConsumo(
  episodioId: string,
  chave: string,
  segundo: number,
  usuarioId?: string
): Promise<{ novoIntervalo: boolean; novaSessao: boolean }> {
  const dia = inicioDoDiaUtc();
  const chaveHash = chaveProtegida(chave, usuarioId);
  const identificador = { episodioId, chave: chaveHash, dia };

  const anterior = await banco.sessaoConsumo.findUnique({
    where: { episodioId_chave_dia: identificador },
    select: { id: true }
  });

  const sessao = await banco.sessaoConsumo.upsert({
    where: { episodioId_chave_dia: identificador },
    create: {
      episodioId,
      usuarioId: usuarioId ?? null,
      chave: chaveHash,
      dia,
      ultimaAtividade: new Date()
    },
    update: { usuarioId: usuarioId ?? null, ultimaAtividade: new Date() },
    select: { id: true }
  });

  const faixa = inicioDoIntervalo(segundo);
  const existente = await banco.consumoIntervalo.findUnique({
    where: { sessaoId_inicioSegundos: { sessaoId: sessao.id, inicioSegundos: faixa } },
    select: { id: true }
  });

  if (!existente) {
    try {
      await banco.consumoIntervalo.create({
        data: { sessaoId: sessao.id, inicioSegundos: faixa }
      });
    } catch (erro) {
      // Duas requisicoes simultaneas podem disputar o mesmo minuto. So absorvemos o
      // erro quando a linha realmente passou a existir; outros erros continuam subindo.
      const criadoEmParalelo = await banco.consumoIntervalo.findUnique({
        where: { sessaoId_inicioSegundos: { sessaoId: sessao.id, inicioSegundos: faixa } },
        select: { id: true }
      });
      if (!criadoEmParalelo) throw erro;
    }
  }

  return { novoIntervalo: !existente, novaSessao: !anterior };
}

export interface PontoDoHeatmap {
  segundo: number;
  visualizacoes: number;
  intensidade: number;
}

export async function lerHeatmap(episodioId: string): Promise<{
  pontos: PontoDoHeatmap[];
  sessoes: number;
  maximo: number;
}> {
  const [grupos, sessoes] = await Promise.all([
    banco.consumoIntervalo.groupBy({
      by: ['inicioSegundos'],
      where: { sessao: { episodioId } },
      _count: { _all: true },
      orderBy: { inicioSegundos: 'asc' }
    }),
    banco.sessaoConsumo.count({ where: { episodioId } })
  ]);

  const maximo = grupos.reduce((maior, grupo) => Math.max(maior, grupo._count._all), 0);
  const pontos = grupos.map((grupo) => ({
    segundo: grupo.inicioSegundos,
    visualizacoes: grupo._count._all,
    intensidade: maximo === 0 ? 0 : Math.round((grupo._count._all / maximo) * 100) / 100
  }));

  return { pontos, sessoes, maximo };
}

export async function contarVisualizacoesRecentesDeTitulo(
  tituloId: string,
  desde: Date
): Promise<number> {
  return banco.sessaoConsumo.count({
    where: {
      iniciadaEm: { gte: desde },
      episodio: { temporada: { tituloId } }
    }
  });
}
