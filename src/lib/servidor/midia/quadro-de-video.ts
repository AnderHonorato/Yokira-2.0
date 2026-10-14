// Arquivo: src/lib/servidor/midia/quadro-de-video.ts
// Tira um quadro do proprio video pra virar capa. Evita pedir uma arte separada pra
// cada episodio: o frame certo do episodio ja e uma capa boa.

import { spawn } from 'node:child_process';

const BINARIO = process.env.CAMINHO_FFMPEG ?? 'ffmpeg';

/** Segundo pedido, preso a um numero que faz sentido pro ffmpeg. */
export function segundoValido(valor: unknown): number {
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero < 0) return 0;
  // 24h de teto: qualquer coisa alem disso e engano de digitacao, nao episodio.
  return Math.min(86_400, Math.round(numero * 100) / 100);
}

/** Argumentos do ffmpeg. Separados pra dar pra testar sem rodar nada. */
export function argumentosDoQuadro(caminho: string, segundo: number): string[] {
  return [
    '-hide_banner',
    // O -ss antes do -i faz o ffmpeg pular direto, sem decodificar o caminho todo:
    // com ele depois, um episodio de 24 min levaria dezenas de segundos por quadro.
    '-ss',
    String(segundo),
    '-i',
    caminho,
    '-frames:v',
    '1',
    '-q:v',
    '3',
    '-f',
    'image2',
    'pipe:1'
  ];
}

/** Devolve o quadro em JPEG. Rejeita quando o ffmpeg falha ou nao escreve nada. */
export function extrairQuadro(caminho: string, segundo: number): Promise<Buffer> {
  return new Promise((resolver, rejeitar) => {
    const processo = spawn(BINARIO, argumentosDoQuadro(caminho, segundoValido(segundo)));
    const pedacos: Buffer[] = [];
    let erro = '';

    processo.stdout.on('data', (pedaco: Buffer) => pedacos.push(pedaco));
    processo.stderr.on('data', (pedaco) => {
      erro = String(pedaco).slice(-300);
    });
    processo.on('error', () => rejeitar(new Error('Não encontrei o ffmpeg para gerar a capa.')));
    processo.on('close', (codigo) => {
      const bytes = Buffer.concat(pedacos);
      if (codigo === 0 && bytes.length > 0) return resolver(bytes);
      // Segundo alem do fim do video sai com codigo 0 e zero byte: por isso o tamanho
      // entra na condicao, senao gravariamos uma capa vazia sem ninguem notar.
      rejeitar(new Error(`Não consegui tirar o quadro nesse segundo. ${erro}`.trim()));
    });
  });
}
