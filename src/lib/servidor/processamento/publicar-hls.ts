// Publica uma pasta de HLS apenas quando todos os segmentos estão gravados.
// Se a confirmação dos metadados falhar, restaura a versão anterior.

import { rename, rm, stat } from 'node:fs/promises';

async function existe(caminho: string): Promise<boolean> {
  try {
    await stat(caminho);
    return true;
  } catch (erro) {
    if ((erro as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw erro;
  }
}

export async function publicarPastaHls(
  nova: string,
  destino: string,
  confirmar: () => Promise<void>
): Promise<void> {
  const anterior = `${destino}.anterior`;

  // Um processo interrompido pode ter movido a pasta antiga sem terminar.
  // Nesse caso a versão anterior precisa voltar antes de uma nova conversão.
  if ((await existe(anterior)) && !(await existe(destino))) {
    await rename(anterior, destino);
  }
  if (await existe(anterior)) await rm(anterior, { recursive: true, force: true });

  const haviaAnterior = await existe(destino);
  if (haviaAnterior) await rename(destino, anterior);

  let publicouNova = false;
  try {
    await rename(nova, destino);
    publicouNova = true;
    await confirmar();
    if (haviaAnterior) await rm(anterior, { recursive: true, force: true });
  } catch (erro) {
    if (publicouNova) await rm(destino, { recursive: true, force: true }).catch(() => {});
    if (haviaAnterior) await rename(anterior, destino);
    throw erro;
  }
}
