// Conversao HLS: processa um trabalho por vez, isolando a saida parcial da publica.
// A fila no banco decide QUEM executa; este modulo so gera e publica as variantes.

import { spawn } from 'node:child_process';
import { mkdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { banco } from '../banco/cliente.js';
import { pastaDeHls } from '../midia/caminhos.js';
import { PERFIS, argumentosDaVariante, playlistMestre } from './perfis-hls.js';

const BINARIO = process.env.CAMINHO_FFMPEG ?? 'ffmpeg';
const LIMITE_FFMPEG_MS = 2 * 60 * 60 * 1000;

export async function ffmpegDisponivel(): Promise<boolean> {
  return new Promise((resolver) => {
    const processo = spawn(BINARIO, ['-version']);
    processo.on('error', () => resolver(false));
    processo.on('close', (codigo) => resolver(codigo === 0));
  });
}

function executar(argumentos: string[]): Promise<void> {
  return new Promise((resolver, rejeitar) => {
    const processo = spawn(BINARIO, argumentos);
    let ultimaSaida = '';
    let encerrado = false;
    const temporizador = setTimeout(() => {
      encerrado = true;
      processo.kill('SIGKILL');
    }, LIMITE_FFMPEG_MS);

    processo.stderr.on('data', (pedaco) => {
      ultimaSaida = String(pedaco).slice(-400);
    });
    processo.once('error', (erro) => {
      clearTimeout(temporizador);
      rejeitar(erro);
    });
    processo.once('close', (codigo) => {
      clearTimeout(temporizador);
      if (encerrado) rejeitar(new Error('FFmpeg excedeu o prazo de processamento.'));
      else if (codigo === 0) resolver();
      else rejeitar(new Error(`FFmpeg saiu com código ${codigo}: ${ultimaSaida}`));
    });
  });
}

/** Deixa o manifesto mestre invisivel ate todas as variantes estarem prontas. */
export async function converterArquivo(arquivoId: string, trabalhoId: string): Promise<void> {
  const arquivo = await banco.arquivoMidia.findUnique({ where: { id: arquivoId } });
  if (!arquivo) throw new Error('O arquivo cadastrado não existe.');

  const informacao = await stat(arquivo.caminho).catch(() => null);
  if (!informacao?.isFile()) throw new Error('O vídeo original não foi encontrado no disco.');

  const raiz = pastaDeHls();
  const destino = join(raiz, arquivoId);
  const temporario = join(raiz, `.${arquivoId}-${trabalhoId}.tmp`);

  await mkdir(raiz, { recursive: true });
  await rm(temporario, { recursive: true, force: true });
  await mkdir(temporario, { recursive: true });

  try {
    for (const [indice, perfil] of PERFIS.entries()) {
      await executar(argumentosDaVariante(arquivo.caminho, temporario, perfil));
      await banco.trabalhoProcessamento.update({
        where: { id: trabalhoId },
        data: { progresso: Math.round(((indice + 1) / (PERFIS.length + 1)) * 100) }
      });
    }

    await writeFile(join(temporario, 'mestre.m3u8'), playlistMestre(PERFIS), 'utf8');

    // Na reexecucao, substitui as variantes completas, nunca uma playlist parcial.
    await rm(destino, { recursive: true, force: true });
    await rename(temporario, destino);

    await banco.$transaction([
      banco.varianteHls.deleteMany({ where: { arquivoId } }),
      banco.varianteHls.createMany({
        data: PERFIS.map((perfil) => ({
          arquivoId,
          altura: perfil.altura,
          taxaBits: perfil.taxaBits,
          playlist: `${perfil.altura}p.m3u8`
        }))
      }),
      banco.trabalhoProcessamento.update({
        where: { id: trabalhoId },
        data: { situacao: 'CONCLUIDO', progresso: 100, mensagem: null }
      })
    ]);
  } catch (erro) {
    await rm(temporario, { recursive: true, force: true }).catch(() => {});
    throw erro;
  }
}
