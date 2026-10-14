// Arquivo: src/lib/servidor/autenticacao/sessao.ts
// Sessao guardada no banco (nao em JWT) pra conseguir revogar de verdade — o "encerrar
// todas as sessoes" precisa disso. O cookie carrega so o id opaco.

import { randomBytes, createHash } from 'node:crypto';
import { banco } from '../banco/cliente.js';
import type { Papel } from '../banco/gerado/enums.js';

export const NOME_COOKIE_SESSAO = 'yokira_sessao';
const DURACAO_MS = 1000 * 60 * 60 * 24 * 30;

export interface UsuarioDaSessao {
  id: string;
  email: string;
  nome: string;
  papel: Papel;
}

export function gerarIdDeSessao(): string {
  return randomBytes(32).toString('base64url');
}

/** Guardamos o hash: quem ler o banco nao consegue se passar por ninguem. */
function digerir(id: string): string {
  return createHash('sha256').update(id).digest('hex');
}

export async function criarSessao(usuarioId: string, agenteUsuario?: string) {
  const id = gerarIdDeSessao();
  await banco.sessao.create({
    data: {
      id: digerir(id),
      usuarioId,
      agenteUsuario: agenteUsuario?.slice(0, 255) ?? null,
      expiraEm: new Date(Date.now() + DURACAO_MS)
    }
  });
  return { id, expiraEm: new Date(Date.now() + DURACAO_MS) };
}

export async function lerSessao(id: string): Promise<UsuarioDaSessao | null> {
  const sessao = await banco.sessao.findUnique({
    where: { id: digerir(id) },
    include: { usuario: true }
  });

  if (!sessao || sessao.revogadaEm || sessao.expiraEm < new Date()) return null;

  return {
    id: sessao.usuario.id,
    email: sessao.usuario.email,
    nome: sessao.usuario.nome,
    papel: sessao.usuario.papel
  };
}

export async function revogarSessao(id: string): Promise<void> {
  await banco.sessao.updateMany({
    where: { id: digerir(id) },
    data: { revogadaEm: new Date() }
  });
}

export async function revogarTodasAsSessoes(usuarioId: string): Promise<number> {
  const resultado = await banco.sessao.updateMany({
    where: { usuarioId, revogadaEm: null },
    data: { revogadaEm: new Date() }
  });
  return resultado.count;
}
