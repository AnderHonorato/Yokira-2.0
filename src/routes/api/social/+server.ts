// Arquivo: src/routes/api/social/+server.ts

import { error, json } from '@sveltejs/kit';
import {
  criarComentario,
  definirCurtida,
  denunciarComentario,
  editarComentario,
  lerSocial,
  removerComentario,
  tituloIdDoAlvo,
  type AlvoSocial
} from '$servidor/banco/social';
import { atualizarRankingDoTitulo } from '$servidor/banco/ranking';
import type { RequestHandler } from './$types';

function alvoDe(valor: Record<string, unknown>): AlvoSocial {
  const tituloId = String(valor.tituloId ?? '').trim() || undefined;
  const episodioId = String(valor.episodioId ?? '').trim() || undefined;
  return { tituloId, episodioId };
}

function podeModerar(papel: string | undefined): boolean {
  return papel === 'MODERADOR' || papel === 'ADMINISTRADOR';
}

function mensagemDoErro(erroRecebido: unknown): string {
  return erroRecebido instanceof Error ? erroRecebido.message : 'Não foi possível concluir a ação.';
}

export const GET: RequestHandler = async ({ url, locals }) => {
  const alvo = alvoDe(Object.fromEntries(url.searchParams.entries()));
  try {
    return json(await lerSocial(alvo, locals.usuario?.id));
  } catch (erroRecebido) {
    throw error(400, mensagemDoErro(erroRecebido));
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.usuario) throw error(401, 'Entre na sua conta para interagir.');
  const corpo = (await request.json()) as Record<string, unknown>;
  const acao = String(corpo.acao ?? '');

  try {
    if (acao === 'denunciar') {
      return json(
        await denunciarComentario(
          locals.usuario.id,
          String(corpo.comentarioId ?? ''),
          corpo.motivo
        )
      );
    }

    const alvo = alvoDe(corpo);
    let estado;
    if (acao === 'curtir') {
      estado = await definirCurtida(alvo, locals.usuario.id, Boolean(corpo.curtir));
    } else if (acao === 'comentar') {
      estado = await criarComentario(alvo, locals.usuario.id, corpo.corpo);
    } else {
      throw new Error('Ação social inválida.');
    }

    await atualizarRankingDoTitulo(await tituloIdDoAlvo(alvo));
    return json(estado);
  } catch (erroRecebido) {
    throw error(400, mensagemDoErro(erroRecebido));
  }
};

export const PATCH: RequestHandler = async ({ request, locals }) => {
  if (!locals.usuario) throw error(401, 'Entre na sua conta para editar comentários.');
  const corpo = (await request.json()) as Record<string, unknown>;
  try {
    return json(
      await editarComentario(
        String(corpo.comentarioId ?? ''),
        locals.usuario.id,
        corpo.corpo,
        podeModerar(locals.usuario.papel)
      )
    );
  } catch (erroRecebido) {
    throw error(400, mensagemDoErro(erroRecebido));
  }
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
  if (!locals.usuario) throw error(401, 'Entre na sua conta para remover comentários.');
  const corpo = (await request.json()) as Record<string, unknown>;
  try {
    return json(
      await removerComentario(
        String(corpo.comentarioId ?? ''),
        locals.usuario.id,
        podeModerar(locals.usuario.papel)
      )
    );
  } catch (erroRecebido) {
    throw error(400, mensagemDoErro(erroRecebido));
  }
};
