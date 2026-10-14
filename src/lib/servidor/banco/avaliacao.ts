// Arquivo: src/lib/servidor/banco/avaliacao.ts
// Nota do titulo. Guardo de 1 a 10 (igual as telas mostram "8.6") e nao de 1 a 5.

import { banco } from './cliente.js';

export async function avaliarTitulo(usuarioId: string, tituloId: string, nota: number) {
  await banco.avaliacao.upsert({
    where: { usuarioId_tituloId: { usuarioId, tituloId } },
    create: { usuarioId, tituloId, nota },
    update: { nota }
  });
  return mediaDoTitulo(tituloId);
}

export async function removerAvaliacao(usuarioId: string, tituloId: string) {
  // deleteMany e nao delete: descurtir duas vezes nao pode virar erro 500.
  await banco.avaliacao.deleteMany({ where: { usuarioId, tituloId } });
  return mediaDoTitulo(tituloId);
}

export async function notaDoUsuario(usuarioId: string, tituloId: string): Promise<number | null> {
  const avaliacao = await banco.avaliacao.findUnique({
    where: { usuarioId_tituloId: { usuarioId, tituloId } },
    select: { nota: true }
  });
  return avaliacao?.nota ?? null;
}

export async function mediaDoTitulo(
  tituloId: string
): Promise<{ media: number | null; total: number }> {
  const avaliacoes = await banco.avaliacao.findMany({
    where: { tituloId },
    select: { nota: true }
  });

  if (avaliacoes.length === 0) return { media: null, total: 0 };

  const soma = avaliacoes.reduce((total, item) => total + item.nota, 0);
  return { media: Math.round((soma / avaliacoes.length) * 10) / 10, total: avaliacoes.length };
}
