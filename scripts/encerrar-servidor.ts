// Arquivo: scripts/encerrar-servidor.ts
// Mata o processo que estiver segurando a porta 4000. Existe porque "porta em uso" e o
// erro numero 1 de quem fecha o terminal sem derrubar o `npm run dev`.
// Uso: npm run encerrar  (ou: npm run encerrar -- 4001)

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const executar = promisify(execFile);
const PORTA = Number(process.argv[2] ?? process.env.PORT ?? 4000);

async function pidsNaPorta(porta: number): Promise<number[]> {
  const comandos: [string, string[]][] = [
    ['lsof', ['-ti', `tcp:${porta}`]],
    ['fuser', [`${porta}/tcp`]]
  ];

  for (const [binario, argumentos] of comandos) {
    try {
      const { stdout } = await executar(binario, argumentos);
      const encontrados = stdout
        .split(/\s+/)
        .map((valor) => Number(valor.trim()))
        .filter((valor) => Number.isInteger(valor) && valor > 0);
      if (encontrados.length > 0) return [...new Set(encontrados)];
    } catch {
      // Binario ausente ou porta livre: tenta o proximo.
    }
  }
  return [];
}

const pids = await pidsNaPorta(PORTA);

if (pids.length === 0) {
  console.log(`Porta ${PORTA} ja esta livre. Nada a encerrar.`);
} else {
  for (const pid of pids) {
    try {
      process.kill(pid, 'SIGTERM');
      console.log(`Encerrado o processo ${pid} que ocupava a porta ${PORTA}.`);
    } catch (erro) {
      console.error(`Nao consegui encerrar o ${pid}:`, erro instanceof Error ? erro.message : erro);
    }
  }
}
