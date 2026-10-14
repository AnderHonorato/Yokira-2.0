// Arquivo: src/lib/servidor/banco/progresso.ts
// Progresso e historico. O historico e append-only de proposito: limpar progresso
// nao pode apagar por tabela o que a pessoa ja assistiu.

import { banco } from './cliente.js';

const FRACAO_PARA_CONSIDERAR_CONCLUIDO = 0.92;

export async function salvarProgresso(usuarioId: string, episodioId: string, segundos: number) {
  const episodio = await banco.episodio.findUnique({
    where: { id: episodioId },
    select: { duracaoSegundos: true }
  });
  if (!episodio) return null;

  const concluido = segundos >= episodio.duracaoSegundos * FRACAO_PARA_CONSIDERAR_CONCLUIDO;

  const registro = await banco.progresso.upsert({
    where: { usuarioId_episodioId: { usuarioId, episodioId } },
    create: { usuarioId, episodioId, segundos, concluido },
    update: { segundos, concluido }
  });

  await banco.historico.create({ data: { usuarioId, episodioId } });
  return registro;
}

export async function lerProgresso(usuarioId: string, episodioId: string) {
  return banco.progresso.findUnique({
    where: { usuarioId_episodioId: { usuarioId, episodioId } }
  });
}

export async function progressoDoTitulo(usuarioId: string, tituloId: string) {
  return banco.progresso.findMany({
    where: { usuarioId, episodio: { temporada: { tituloId } } },
    select: { episodioId: true, segundos: true, concluido: true }
  });
}

export async function limparHistorico(usuarioId: string): Promise<number> {
  const resultado = await banco.historico.deleteMany({ where: { usuarioId } });
  return resultado.count;
}
