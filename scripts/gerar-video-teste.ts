// Arquivo: scripts/gerar-video-teste.ts
// Gera um mp4 sintetico com o proprio ffmpeg pra testar o pipeline de upload/HLS
// sem precisar de nenhum conteudo de terceiro.
// Uso: npx tsx scripts/gerar-video-teste.ts midia/teste.mp4 20

import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const destino = process.argv[2] ?? './midia/teste.mp4';
const segundos = Number(process.argv[3] ?? 20);
const binario = process.env.CAMINHO_FFMPEG ?? 'ffmpeg';

await mkdir(dirname(destino), { recursive: true });

const argumentos = [
  '-hide_banner',
  '-y',
  '-f',
  'lavfi',
  '-i',
  `testsrc=size=1280x720:rate=30:duration=${segundos}`,
  '-f',
  'lavfi',
  '-i',
  `sine=frequency=440:duration=${segundos}`,
  '-c:v',
  'libx264',
  '-preset',
  'veryfast',
  '-pix_fmt',
  'yuv420p',
  '-c:a',
  'aac',
  '-shortest',
  destino
];

const processo = spawn(binario, argumentos, { stdio: 'inherit' });
processo.on('error', () => {
  console.error(
    `Nao encontrei o ffmpeg em "${binario}". Instale ou ajuste CAMINHO_FFMPEG no .env.`
  );
  process.exit(1);
});
processo.on('close', (codigo) => {
  if (codigo === 0) console.log(`Video de teste gerado em ${destino}`);
  process.exit(codigo ?? 1);
});
