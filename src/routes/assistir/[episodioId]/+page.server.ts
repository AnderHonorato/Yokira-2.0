// Arquivo: src/routes/assistir/[episodioId]/+page.server.ts

import { error } from '@sveltejs/kit';
import { banco } from '$servidor/banco/cliente';
import { estreou, podeVerAntesDaEstreia } from '$servidor/banco/estreia';
import { lerProgresso } from '$servidor/banco/progresso';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const episodio = await banco.episodio.findUnique({
    where: { id: params.episodioId },
    include: {
      temporada: { include: { titulo: true } },
      arquivos: { include: { variantes: true } }
    }
  });

  if (!episodio) throw error(404, 'Episódio não encontrado.');

  // Mesmo 404 de quando o episodio nao existe: dizer "ainda nao estreou" contaria
  // que ele existe e quando. Quem edita passa, pra conferir antes da hora.
  if (!estreou(episodio.publicadoEm) && !podeVerAntesDaEstreia(locals.usuario?.papel)) {
    throw error(404, 'Episódio não encontrado.');
  }

  const progresso = locals.usuario ? await lerProgresso(locals.usuario.id, episodio.id) : null;

  // A URL da midia NAO sai daqui: ela e assinada e curta, e vem do /api/midia/playlist
  // no momento do play. A pagina so diz se existe video pra tocar.
  const temMidia = episodio.arquivos.some((arquivo) => arquivo.variantes.length > 0);

  return {
    episodio: {
      id: episodio.id,
      numero: episodio.numero,
      nome: episodio.nome,
      duracaoMinutos: Math.round(episodio.duracaoSegundos / 60)
    },
    titulo: { nome: episodio.temporada.titulo.nome, slug: episodio.temporada.titulo.slug },
    temporada: episodio.temporada.numero,
    temMidia,
    segundoInicial: progresso?.segundos ?? 0
  };
};
