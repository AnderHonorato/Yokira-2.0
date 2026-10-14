// Arquivo: src/routes/verificar-email/+page.server.ts
// Consome o token no GET mesmo: o efeito e so marcar o e-mail como verificado, e
// exigir um clique a mais so pra confirmar um clique nao protege de nada aqui.

import { consumirTokenDeVerificacao } from '$servidor/autenticacao/tokens-email';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
  const token = url.searchParams.get('token') ?? '';
  return { verificado: await consumirTokenDeVerificacao(token) };
};
