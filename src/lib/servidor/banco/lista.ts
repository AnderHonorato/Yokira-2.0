// Arquivo: src/lib/servidor/banco/lista.ts
// Minha Lista. Alternar em vez de add/remove separados: um clique so, sem estado divergente.

import { banco } from './cliente.js';
import { paraCartao, type TituloBruto } from './mapear-titulo.js';

export async function alternarItemDaLista(usuarioId: string, tituloId: string) {
  const existente = await banco.itemLista.findUnique({
    where: { usuarioId_tituloId: { usuarioId, tituloId } }
  });

  if (existente) {
    await banco.itemLista.delete({ where: { id: existente.id } });
    return { naLista: false };
  }

  await banco.itemLista.create({ data: { usuarioId, tituloId } });
  return { naLista: true };
}

export async function listarMinhaLista(usuarioId: string) {
  const itens = await banco.itemLista.findMany({
    where: { usuarioId },
    orderBy: { criadoEm: 'desc' },
    include: {
      titulo: {
        include: {
          temporadas: { select: { numero: true } },
          generos: { select: { genero: { select: { nome: true } } } },
          avaliacoes: { select: { nota: true } }
        }
      }
    }
  });

  return itens.map((item) => paraCartao(item.titulo as unknown as TituloBruto));
}

export async function idsNaLista(usuarioId: string): Promise<string[]> {
  const itens = await banco.itemLista.findMany({
    where: { usuarioId },
    select: { tituloId: true }
  });
  return itens.map((item) => item.tituloId);
}
