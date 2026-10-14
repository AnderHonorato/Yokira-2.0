// Arquivo: src/routes/+layout.server.ts
// O usuario da sessao desce pra toda pagina; sem isso cada rota faria a mesma consulta.

import { temPapelMinimo } from '$servidor/permissoes/papeis';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  return {
    usuario: locals.usuario,
    // Mesmo minimo que admin/+layout.server.ts exige. Resolvido aqui pra casca poder
    // mostrar o atalho do painel sem importar regra de servidor dentro do navegador.
    podeAcessarPainel: temPapelMinimo(locals.usuario?.papel, 'EDITOR')
  };
};
