// Inicia a aplicação Node e o trabalhador FFmpeg no mesmo volume persistente.
// Útil em um serviço único com volume (Railway/Docker), sem misturar processos.

import 'dotenv/config';
import { spawn, type ChildProcess } from 'node:child_process';
import { join } from 'node:path';
import { pendenciasDeProducao } from '../src/lib/servidor/seguranca/config-producao.js';

process.env.PORT ??= '4000';
process.env.HOST ??= '0.0.0.0';
process.env.BODY_SIZE_LIMIT ??= '8G';
if (!process.env.ORIGIN && process.env.RAILWAY_PUBLIC_DOMAIN) {
  process.env.ORIGIN = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
}

const problemas = pendenciasDeProducao(process.env);
if (problemas.length) {
  console.error('Yokira não iniciado: configuração insegura.');
  for (const problema of problemas) console.error(`- ${problema}`);
  process.exit(1);
}

function criarProcesso(argumentos: string[]): ChildProcess {
  return spawn(process.execPath, argumentos, { stdio: 'inherit', env: process.env });
}

function migrarBanco(): Promise<void> {
  return new Promise((resolver, rejeitar) => {
    const cli = join(process.cwd(), 'node_modules', 'prisma', 'build', 'index.js');
    const processo = criarProcesso([cli, 'migrate', 'deploy']);
    processo.once('error', rejeitar);
    processo.once('exit', (codigo) => {
      if (codigo === 0) resolver();
      else rejeitar(new Error(`Migração do banco falhou (código ${codigo}).`));
    });
  });
}

await migrarBanco();

let encerrando = false;
let servidor: ChildProcess | null = null;
let trabalhador: ChildProcess | null = null;
const falhasDoTrabalhador: number[] = [];

function encerrar(codigo: number) {
  if (encerrando) return;
  encerrando = true;
  trabalhador?.kill('SIGTERM');
  servidor?.kill('SIGTERM');
  setTimeout(() => process.exit(codigo), 10_000).unref();
}

function iniciarTrabalhador() {
  if (encerrando) return;
  trabalhador = criarProcesso(['--import', 'tsx', 'scripts/trabalhador-hls.ts']);
  trabalhador.once('error', (erro) => console.error('Erro no trabalhador HLS:', erro));
  trabalhador.once('exit', () => {
    if (encerrando) return;
    const agora = Date.now();
    falhasDoTrabalhador.push(agora);
    while (falhasDoTrabalhador.length && falhasDoTrabalhador[0] < agora - 60_000) {
      falhasDoTrabalhador.shift();
    }
    if (falhasDoTrabalhador.length > 5) {
      console.error('Trabalhador HLS falhou muitas vezes. Encerrando serviço para recuperação.');
      encerrar(1);
      return;
    }
    console.error('Trabalhador HLS caiu; reinício em três segundos.');
    setTimeout(iniciarTrabalhador, 3_000).unref();
  });
}

process.once('SIGTERM', () => encerrar(0));
process.once('SIGINT', () => encerrar(0));

servidor = criarProcesso(['build/index.js']);
servidor.once('error', (erro) => {
  console.error('Falha ao iniciar o servidor Yokira:', erro);
  encerrar(1);
});
servidor.once('exit', (codigo) => {
  if (!encerrando) encerrar(codigo || 1);
});
iniciarTrabalhador();
console.log('Yokira: servidor e trabalhador HLS iniciados.');
