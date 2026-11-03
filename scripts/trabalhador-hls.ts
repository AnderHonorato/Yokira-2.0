// Trabalhador dedicado a FFmpeg. Inicie um processo separado do servidor web:
// npm run video:trabalhador
//
// Não executa HTTP, não abre porta e pode ser reiniciado sem perder a fila.

import 'dotenv/config';
import { consumirPendentes, recuperarInterrompidos } from '../src/lib/servidor/processamento/fila-video.js';

const INTERVALO_MS = 5_000;
const RECUPERAR_CADA_MS = 60_000;
let encerrando = false;
let proximaRecuperacao = 0;

process.once('SIGTERM', () => {
  encerrando = true;
});
process.once('SIGINT', () => {
  encerrando = true;
});

function pausa(duracao: number): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, duracao));
}

console.log('Trabalhador HLS iniciado. Fila persistida no banco do Yokira.');

while (!encerrando) {
  try {
    if (Date.now() >= proximaRecuperacao) {
      const recuperados = await recuperarInterrompidos();
      if (recuperados > 0) console.log(`${recuperados} trabalho(s) interrompido(s) reenfileirado(s).`);
      proximaRecuperacao = Date.now() + RECUPERAR_CADA_MS;
    }

    const total = await consumirPendentes(1);
    if (total === 0 && !encerrando) await pausa(INTERVALO_MS);
  } catch (erro) {
    console.error('Falha no ciclo do trabalhador HLS:', erro);
    if (!encerrando) await pausa(INTERVALO_MS);
  }
}

console.log('Trabalhador HLS encerrado.');
