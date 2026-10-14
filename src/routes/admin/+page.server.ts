// Arquivo: src/routes/admin/+page.server.ts

import { banco } from '$servidor/banco/cliente';
import { ffmpegDisponivel } from '$servidor/processamento/transcodificar';
import { temPapelMinimo } from '$servidor/permissoes/papeis';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const [titulos, episodios, trabalhos, denunciasAbertas, temFfmpeg] = await Promise.all([
    banco.titulo.count(),
    banco.episodio.count(),
    banco.trabalhoProcessamento.findMany({ orderBy: { criadoEm: 'desc' }, take: 10 }),
    banco.denuncia.count({ where: { resolvida: false } }),
    ffmpegDisponivel()
  ]);

  // Os atalhos saem prontos daqui: a tela nao precisa importar a tabela de papeis
  // (que e codigo de servidor) so pra decidir o que mostrar.
  return {
    titulos,
    episodios,
    trabalhos,
    denunciasAbertas,
    temFfmpeg,
    podeModerar: temPapelMinimo(locals.usuario?.papel, 'MODERADOR'),
    podeGerirUsuarios: temPapelMinimo(locals.usuario?.papel, 'ADMINISTRADOR')
  };
};
