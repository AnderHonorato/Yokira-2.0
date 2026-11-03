// Processo separado para retomar vídeos após reinício do servidor.
// Em produção, mantenha este comando supervisionado (systemd, Docker ou similar).

import 'dotenv/config';
import { banco } from '../src/lib/servidor/banco/cliente.js';
import {
  consumirPendentes,
  recuperarInterrompidos
} from '../src/lib/servidor/processamento/fila-video.js';

let encerrando = false;
process.once('SIGINT', () => { encerrando = true; });
process.once('SIGTERM', () => { encerrando = true; });

const pausa = (ms: number) => new Promise<void>((resolver) => setTimeout(resolver, ms));

try {
  const retomados = await recuperarInterrompidos();
  if (retomados) console.log(`Yokira: ${retomados} trabalho(s) recuperado(s).`);

  console.log('Trabalhador HLS iniciado. Aguardando vídeos na fila.');
  while (!encerrando) {
    try {
      const processados = await consumirPendentes(5);
      if (processados === 0) await pausa(5_000);
    } catch (erro) {
      console.error('Erro ao consultar fila HLS:', erro);
      await pausa(10_000);
    }
  }
} finally {
  await banco.$disconnect();
}
