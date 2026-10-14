// Arquivo: src/routes/admin/+layout.server.ts
// Portao unico do painel. Barrar aqui vale pra toda subrota do admin.

import { redirect } from '@sveltejs/kit';
import { exigirPapel } from '$servidor/permissoes/papeis';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.usuario) throw redirect(303, '/entrar');
  exigirPapel(locals.usuario.papel, 'EDITOR');
  return { usuario: locals.usuario };
};
