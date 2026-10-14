// Arquivo: src/hooks.server.ts
// Le a sessao uma vez por requisicao e deixa em locals. Tambem devolve os cabecalhos de
// seguranca — mais barato aqui do que repetir em cada rota.

import type { Handle } from '@sveltejs/kit';
import { NOME_COOKIE_SESSAO, lerSessao } from '$lib/servidor/autenticacao/sessao';
import { apagarCookieDeSessao } from '$lib/servidor/autenticacao/cookie';
import { NOME_COOKIE_TEMA, metaDeTema, normalizarTema } from '$lib/validacoes/tema';

const CABECALHOS_DE_SEGURANCA: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

export const handle: Handle = async ({ event, resolve }) => {
  const id = event.cookies.get(NOME_COOKIE_SESSAO);
  event.locals.usuario = id ? await lerSessao(id) : null;

  // Cookie apontando pra sessao morta so atrapalha: limpo na hora.
  if (id && !event.locals.usuario) apagarCookieDeSessao(event.cookies);

  // O tema entra no HTML no servidor. Resolver isso no navegador faria a pagina
  // pintar escura e so depois clarear — o "flash" que todo tema claro mal feito tem.
  const tema = normalizarTema(event.cookies.get(NOME_COOKIE_TEMA));
  event.locals.tema = tema;

  const resposta = await resolve(event, {
    transformPageChunk: ({ html }) =>
      html.replace('%yokira.tema%', tema).replace('%yokira.metaTema%', metaDeTema(tema))
  });
  for (const [chave, valor] of Object.entries(CABECALHOS_DE_SEGURANCA)) {
    resposta.headers.set(chave, valor);
  }
  return resposta;
};
