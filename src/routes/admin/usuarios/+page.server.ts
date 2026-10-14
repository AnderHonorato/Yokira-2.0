// Arquivo: src/routes/admin/usuarios/+page.server.ts
// Gestao de contas e papeis. Exige ADMINISTRADOR — o layout do admin so garante EDITOR.

import { LIMITE_DE_LISTAGEM, listarUsuariosDoPainel } from '$servidor/banco/administracao-pessoas';
import { exigirPapel } from '$servidor/permissoes/papeis';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
  exigirPapel(locals.usuario?.papel, 'ADMINISTRADOR');

  const busca = url.searchParams.get('busca')?.trim() || undefined;
  const usuarios = await listarUsuariosDoPainel(busca);

  // Sem isso a lista cortava em silencio e a conta procurada simplesmente "nao existia".
  return { usuarios, busca: busca ?? '', truncada: usuarios.length === LIMITE_DE_LISTAGEM };
};
