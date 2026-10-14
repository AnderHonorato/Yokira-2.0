// Arquivo: src/routes/sair/+server.ts
// Sair e POST, nao GET: link de imagem em site alheio nao pode deslogar ninguem.

import { redirect } from '@sveltejs/kit';
import { NOME_COOKIE_SESSAO, revogarSessao } from '$servidor/autenticacao/sessao';
import { apagarCookieDeSessao } from '$servidor/autenticacao/cookie';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
  const id = cookies.get(NOME_COOKIE_SESSAO);
  if (id) await revogarSessao(id);
  apagarCookieDeSessao(cookies);
  throw redirect(303, '/');
};
