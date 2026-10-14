// Arquivo: src/lib/servidor/banco/administracao-pessoas.ts
// O outro eixo do painel: quem sao as pessoas, o que elas podem e o que foi
// reportado ou registrado. Separado de administracao.ts, que cuida do conteudo.

import { banco } from './cliente.js';
import { ErroDeAdministracao } from './administracao.js';
import type { Papel } from './gerado/enums.js';

/** Teto de linhas por listagem. Acima disso a tela manda usar a busca. */
export const LIMITE_DE_LISTAGEM = 100;

export async function listarUsuariosDoPainel(busca?: string) {
  return banco.usuario.findMany({
    where: busca ? { email: { contains: busca } } : undefined,
    orderBy: { criadoEm: 'desc' },
    take: LIMITE_DE_LISTAGEM,
    select: {
      id: true,
      email: true,
      nome: true,
      papel: true,
      emailVerificado: true,
      bloqueadoAte: true,
      criadoEm: true
    }
  });
}

export async function contarAdministradores(): Promise<number> {
  return banco.usuario.count({ where: { papel: 'ADMINISTRADOR' } });
}

/**
 * Trocar papel com uma trava: nao da pra rebaixar o ultimo administrador. Sem isso
 * um clique errado tranca todo mundo pra fora do painel e so o banco resolve.
 */
export async function trocarPapel(usuarioId: string, papel: Papel) {
  const alvo = await banco.usuario.findUnique({
    where: { id: usuarioId },
    select: { papel: true }
  });
  if (!alvo) throw new ErroDeAdministracao('Usuario nao encontrado.');

  if (alvo.papel === 'ADMINISTRADOR' && papel !== 'ADMINISTRADOR') {
    if ((await contarAdministradores()) <= 1) {
      throw new ErroDeAdministracao('Este e o ultimo administrador. Promova outro antes.');
    }
  }

  return banco.usuario.update({ data: { papel }, where: { id: usuarioId } });
}

export async function listarDenuncias(resolvidas: boolean) {
  return banco.denuncia.findMany({
    where: { resolvida: resolvidas },
    orderBy: { criadoEm: 'desc' },
    take: 100,
    include: { usuario: { select: { email: true, nome: true } } }
  });
}

export async function marcarDenuncia(id: string, resolvida: boolean) {
  return banco.denuncia.update({ data: { resolvida }, where: { id } });
}

export async function listarRegistroAdministrativo() {
  return banco.registroAdministrativo.findMany({
    orderBy: { criadoEm: 'desc' },
    take: 100,
    include: { usuario: { select: { email: true } } }
  });
}
