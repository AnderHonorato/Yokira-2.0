// Arquivo: src/lib/servidor/banco/social.ts
// Curtidas e comentarios independentes para obra e episodio, com autoria, edicao,
// remocao logica e um freio simples de spam persistido no banco.

import { banco } from './cliente.js';

export interface AlvoSocial {
  tituloId?: string;
  episodioId?: string;
}

export interface ComentarioPublico {
  id: string;
  corpo: string;
  autor: { id: string; nome: string };
  criadoEm: string;
  editadoEm: string | null;
  meu: boolean;
}

function validarAlvo(alvo: AlvoSocial): Required<Pick<AlvoSocial, 'tituloId'>> | Required<Pick<AlvoSocial, 'episodioId'>> {
  const temTitulo = Boolean(alvo.tituloId);
  const temEpisodio = Boolean(alvo.episodioId);
  if (temTitulo === temEpisodio) throw new Error('Informe uma obra ou um episódio, nunca os dois.');
  return temTitulo ? { tituloId: alvo.tituloId! } : { episodioId: alvo.episodioId! };
}

function corpoValido(valor: unknown): string {
  const corpo = String(valor ?? '').trim().replace(/\s{3,}/g, '  ');
  if (corpo.length < 2) throw new Error('O comentário precisa ter pelo menos 2 caracteres.');
  if (corpo.length > 1200) throw new Error('O comentário pode ter no máximo 1200 caracteres.');
  return corpo;
}

export async function lerSocial(alvoOriginal: AlvoSocial, usuarioId?: string) {
  const alvo = validarAlvo(alvoOriginal);
  const whereCurtida = 'tituloId' in alvo ? { tituloId: alvo.tituloId } : { episodioId: alvo.episodioId };
  const whereComentario = { ...whereCurtida, situacao: 'PUBLICADO' as const };

  const [curtidas, minhaCurtida, comentarios] = await Promise.all([
    'tituloId' in alvo
      ? banco.curtidaTitulo.count({ where: whereCurtida })
      : banco.curtidaEpisodio.count({ where: whereCurtida }),
    usuarioId
      ? 'tituloId' in alvo
        ? banco.curtidaTitulo.findUnique({
            where: { usuarioId_tituloId: { usuarioId, tituloId: alvo.tituloId } },
            select: { usuarioId: true }
          })
        : banco.curtidaEpisodio.findUnique({
            where: { usuarioId_episodioId: { usuarioId, episodioId: alvo.episodioId } },
            select: { usuarioId: true }
          })
      : Promise.resolve(null),
    banco.comentario.findMany({
      where: whereComentario,
      take: 80,
      orderBy: { criadoEm: 'desc' },
      include: { usuario: { select: { id: true, nome: true } } }
    })
  ]);

  return {
    curtidas,
    curtiu: Boolean(minhaCurtida),
    comentarios: comentarios.map((comentario): ComentarioPublico => ({
      id: comentario.id,
      corpo: comentario.corpo,
      autor: comentario.usuario,
      criadoEm: comentario.criadoEm.toISOString(),
      editadoEm: comentario.editadoEm?.toISOString() ?? null,
      meu: comentario.usuarioId === usuarioId
    }))
  };
}

export async function definirCurtida(alvoOriginal: AlvoSocial, usuarioId: string, curtir: boolean) {
  const alvo = validarAlvo(alvoOriginal);

  if ('tituloId' in alvo) {
    if (curtir) {
      await banco.curtidaTitulo.upsert({
        where: { usuarioId_tituloId: { usuarioId, tituloId: alvo.tituloId } },
        create: { usuarioId, tituloId: alvo.tituloId },
        update: {}
      });
    } else {
      await banco.curtidaTitulo.deleteMany({ where: { usuarioId, tituloId: alvo.tituloId } });
    }
  } else if (curtir) {
    await banco.curtidaEpisodio.upsert({
      where: { usuarioId_episodioId: { usuarioId, episodioId: alvo.episodioId } },
      create: { usuarioId, episodioId: alvo.episodioId },
      update: {}
    });
  } else {
    await banco.curtidaEpisodio.deleteMany({ where: { usuarioId, episodioId: alvo.episodioId } });
  }

  return lerSocial(alvo, usuarioId);
}

async function verificarSpam(usuarioId: string, corpo: string): Promise<void> {
  const desde = new Date(Date.now() - 2 * 60_000);
  const recentes = await banco.comentario.findMany({
    where: { usuarioId, criadoEm: { gte: desde }, situacao: { not: 'REMOVIDO' } },
    select: { corpo: true },
    take: 8,
    orderBy: { criadoEm: 'desc' }
  });
  if (recentes.length >= 5) throw new Error('Muitos comentários em pouco tempo. Tente novamente em instantes.');
  if (recentes.some((item) => item.corpo === corpo)) throw new Error('Esse comentário acabou de ser enviado.');
}

export async function criarComentario(alvoOriginal: AlvoSocial, usuarioId: string, texto: unknown) {
  const alvo = validarAlvo(alvoOriginal);
  const corpo = corpoValido(texto);
  await verificarSpam(usuarioId, corpo);
  await banco.comentario.create({ data: { usuarioId, corpo, ...alvo } });
  return lerSocial(alvo, usuarioId);
}

export async function editarComentario(
  comentarioId: string,
  usuarioId: string,
  texto: unknown,
  podeModerar = false
) {
  const comentario = await banco.comentario.findUnique({ where: { id: comentarioId } });
  if (!comentario || comentario.situacao === 'REMOVIDO') throw new Error('Comentário não encontrado.');
  if (comentario.usuarioId !== usuarioId && !podeModerar) throw new Error('Você não pode editar este comentário.');

  await banco.comentario.update({
    where: { id: comentarioId },
    data: { corpo: corpoValido(texto), editadoEm: new Date() }
  });
  return lerSocial({ tituloId: comentario.tituloId ?? undefined, episodioId: comentario.episodioId ?? undefined }, usuarioId);
}

export async function removerComentario(
  comentarioId: string,
  usuarioId: string,
  podeModerar = false
) {
  const comentario = await banco.comentario.findUnique({ where: { id: comentarioId } });
  if (!comentario) throw new Error('Comentário não encontrado.');
  if (comentario.usuarioId !== usuarioId && !podeModerar) throw new Error('Você não pode remover este comentário.');

  await banco.comentario.update({
    where: { id: comentarioId },
    data: { situacao: 'REMOVIDO', editadoEm: new Date() }
  });
  return lerSocial({ tituloId: comentario.tituloId ?? undefined, episodioId: comentario.episodioId ?? undefined }, usuarioId);
}

export async function denunciarComentario(usuarioId: string, comentarioId: string, motivo: unknown) {
  const texto = String(motivo ?? '').trim().slice(0, 500);
  if (texto.length < 3) throw new Error('Informe o motivo da denúncia.');
  const comentario = await banco.comentario.findUnique({ where: { id: comentarioId }, select: { id: true } });
  if (!comentario) throw new Error('Comentário não encontrado.');

  const repetida = await banco.denuncia.findFirst({
    where: { usuarioId, referencia: `comentario:${comentarioId}`, resolvida: false }
  });
  if (!repetida) {
    await banco.denuncia.create({
      data: { usuarioId, referencia: `comentario:${comentarioId}`, motivo: texto }
    });
  }
  return { ok: true };
}

export async function tituloIdDoAlvo(alvoOriginal: AlvoSocial): Promise<string> {
  const alvo = validarAlvo(alvoOriginal);
  if ('tituloId' in alvo) return alvo.tituloId;
  const episodio = await banco.episodio.findUnique({
    where: { id: alvo.episodioId },
    select: { temporada: { select: { tituloId: true } } }
  });
  if (!episodio) throw new Error('Episódio não encontrado.');
  return episodio.temporada.tituloId;
}
