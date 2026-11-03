// Saúde do backend: usada pelo orquestrador somente quando o banco responde.
// Não expõe versão, segredos, contagens nem dados pessoais.

import { json } from '@sveltejs/kit';
import { banco } from '$servidor/banco/cliente';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  try {
    await banco.$queryRaw`SELECT 1`;
    return json({ disponivel: true }, { headers: { 'cache-control': 'no-store' } });
  } catch {
    return json({ disponivel: false }, { status: 503, headers: { 'cache-control': 'no-store' } });
  }
};
