// Arquivo: src/lib/servidor/autenticacao/limite-tentativas.ts
// Freio de forca bruta no proprio registro do usuario: contador + janela de bloqueio.
// Escolhi o banco em vez de memoria porque o servidor pode rodar em mais de um processo.

import { banco } from '../banco/cliente.js';

const MAXIMO_DE_TENTATIVAS = 6;
const BLOQUEIO_MINUTOS = 15;

export function estaBloqueado(bloqueadoAte: Date | null): boolean {
  return bloqueadoAte !== null && bloqueadoAte > new Date();
}

export async function registrarFalha(usuarioId: string, tentativasAtuais: number): Promise<void> {
  const tentativas = tentativasAtuais + 1;
  const alcancouOLimite = tentativas >= MAXIMO_DE_TENTATIVAS;

  await banco.usuario.update({
    where: { id: usuarioId },
    data: {
      tentativasFalhas: alcancouOLimite ? 0 : tentativas,
      bloqueadoAte: alcancouOLimite ? new Date(Date.now() + BLOQUEIO_MINUTOS * 60_000) : null
    }
  });
}

export async function limparFalhas(usuarioId: string): Promise<void> {
  await banco.usuario.update({
    where: { id: usuarioId },
    data: { tentativasFalhas: 0, bloqueadoAte: null }
  });
}

export function minutosDeBloqueio(): number {
  return BLOQUEIO_MINUTOS;
}
