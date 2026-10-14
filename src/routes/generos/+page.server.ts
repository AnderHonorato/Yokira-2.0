// Arquivo: src/routes/generos/+page.server.ts

import { listarGeneros } from '$servidor/banco/catalogo';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  return { generos: await listarGeneros() };
};
