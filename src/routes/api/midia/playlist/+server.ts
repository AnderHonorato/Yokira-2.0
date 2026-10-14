// Arquivo: src/routes/api/midia/playlist/+server.ts
// Entrega o endereco assinado da playlist mestre no momento do play. Fica fora da carga
// da pagina de proposito: link curto embutido no HTML seria cacheado junto com ela e
// continuaria valendo depois que o usuario saiu.

import { error, json } from '@sveltejs/kit';
import { banco } from '$servidor/banco/cliente';
import { estreou, podeVerAntesDaEstreia } from '$servidor/banco/estreia';
import { urlAssinada, VALIDADE_PLAYLIST_MS } from '$servidor/midia/assinatura-hls';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
  if (!locals.usuario) throw error(401, 'Entre na sua conta para assistir.');

  const episodioId = url.searchParams.get('episodioId')?.trim();
  if (!episodioId) throw error(400, 'Episódio não informado.');

  // A pagina ja barra o agendado, mas este endpoint aceita um id direto: sem a
  // mesma checagem aqui, quem soubesse o id assistiria antes da estreia.
  const episodio = await banco.episodio.findUnique({
    where: { id: episodioId },
    select: { publicadoEm: true }
  });
  if (!episodio) throw error(404, 'Episódio não encontrado.');
  if (!estreou(episodio.publicadoEm) && !podeVerAntesDaEstreia(locals.usuario.papel)) {
    throw error(404, 'Episódio não encontrado.');
  }

  const arquivo = await banco.arquivoMidia.findFirst({
    where: { episodioId },
    orderBy: { criadoEm: 'desc' },
    include: {
      variantes: { select: { id: true } },
      trabalhos: { orderBy: { criadoEm: 'desc' }, take: 1 }
    }
  });

  if (!arquivo) throw error(404, 'Este episódio ainda não tem vídeo.');

  // Sem variante nao ha o que tocar. A mensagem separa "espera um pouco" de "deu ruim",
  // porque o usuario faz coisas diferentes em cada caso.
  if (arquivo.variantes.length === 0) {
    throw error(
      409,
      arquivo.trabalhos[0]?.situacao === 'FALHOU'
        ? 'O processamento deste episódio falhou. Avise a administração.'
        : 'Este episódio ainda está sendo processado. Tente de novo em alguns minutos.'
    );
  }

  const expiraEm = Date.now() + VALIDADE_PLAYLIST_MS;

  return json(
    {
      playlist: urlAssinada({
        arquivoId: arquivo.id,
        recurso: 'mestre.m3u8',
        usuarioId: locals.usuario.id,
        expiraEm
      }),
      expiraEm
    },
    { headers: { 'cache-control': 'private, no-store' } }
  );
};
