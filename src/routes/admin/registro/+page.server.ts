// Arquivo: src/routes/admin/registro/+page.server.ts
// Registro administrativo: o "quem fez o que" que o RegistroAdministrativo ja guardava
// e ninguem tinha como ler sem abrir o banco.

import { listarRegistroAdministrativo } from '$servidor/banco/administracao-pessoas';
import { exigirPapel } from '$servidor/permissoes/papeis';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  exigirPapel(locals.usuario?.papel, 'MODERADOR');
  return { registros: await listarRegistroAdministrativo() };
};
