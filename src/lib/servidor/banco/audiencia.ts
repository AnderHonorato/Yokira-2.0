// Arquivo: src/lib/servidor/banco/audiencia.ts
// "Pessoas assistindo agora" de verdade: sinal a cada 30s, some depois de 90s sem sinal.
// Numero decorativo aqui seria pior do que numero nenhum.

import { banco } from './cliente.js';

export const JANELA_DE_SINAL_MS = 90_000;

function limite(): Date {
  return new Date(Date.now() - JANELA_DE_SINAL_MS);
}

export async function registrarSinal(
  episodioId: string,
  chave: string,
  usuarioId?: string
): Promise<void> {
  const existente = await banco.sessaoAssistindo.findFirst({
    where: { episodioId, chaveAnonima: chave }
  });

  if (existente) {
    await banco.sessaoAssistindo.update({
      where: { id: existente.id },
      data: { ultimoSinal: new Date(), usuarioId: usuarioId ?? null }
    });
    return;
  }

  await banco.sessaoAssistindo.create({
    data: { episodioId, chaveAnonima: chave, usuarioId: usuarioId ?? null }
  });
}

export async function contarAudiencia(episodioId: string): Promise<number> {
  return banco.sessaoAssistindo.count({
    where: { episodioId, ultimoSinal: { gte: limite() } }
  });
}

/** Uma consulta so pra N titulos — evita o N+1 nas trilhas da home. */
export async function contarAudienciaDeVariosTitulos(
  tituloIds: string[]
): Promise<Map<string, number>> {
  if (tituloIds.length === 0) return new Map();

  const sessoes = await banco.sessaoAssistindo.findMany({
    where: {
      ultimoSinal: { gte: limite() },
      episodio: { temporada: { tituloId: { in: tituloIds } } }
    },
    select: { episodio: { select: { temporada: { select: { tituloId: true } } } } }
  });

  const contagem = new Map<string, number>();
  for (const sessao of sessoes) {
    const id = sessao.episodio.temporada.tituloId;
    contagem.set(id, (contagem.get(id) ?? 0) + 1);
  }
  return contagem;
}

export async function limparSinaisVencidos(): Promise<number> {
  const resultado = await banco.sessaoAssistindo.deleteMany({
    where: { ultimoSinal: { lt: limite() } }
  });
  return resultado.count;
}
