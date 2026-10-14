// Arquivo: src/lib/servidor/processamento/transcodificar.ts
// Roda o ffmpeg em processo separado. Nao bloqueia o servidor web: quem pede o upload
// recebe o id do trabalho e acompanha o progresso pelo banco.

import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { banco } from '../banco/cliente.js';
import { pastaDeHls } from '../midia/caminhos.js';
import { PERFIS, argumentosDaVariante, playlistMestre } from './perfis-hls.js';

const BINARIO = process.env.CAMINHO_FFMPEG ?? 'ffmpeg';

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
    processo.stderr.on('data', (pedaco) => {
      ultimaSaida = String(pedaco).slice(-400);
    });
    processo.on('error', rejeitar);
    processo.on('close', (codigo) => {
      if (codigo === 0) resolver();
      else rejeitar(new Error(`ffmpeg saiu com codigo ${codigo}: ${ultimaSaida}`));
    });
  });
}

export async function processarArquivo(arquivoId: string): Promise<void> {
  const arquivo = await banco.arquivoMidia.findUnique({ where: { id: arquivoId } });
  if (!arquivo) return;

  const trabalho = await banco.trabalhoProcessamento.create({
    data: { arquivoId, situacao: 'PROCESSANDO' }
  });

  // Fora de static/: em static/ o servidor de arquivos entregaria os .ts sem
  // passar por sessao nenhuma, que era exatamente o buraco do item 5.2.
  const destino = join(pastaDeHls(), arquivoId);

  try {
    await mkdir(destino, { recursive: true });

    for (const [indice, perfil] of PERFIS.entries()) {
      await executar(argumentosDaVariante(arquivo.caminho, destino, perfil));
      await banco.trabalhoProcessamento.update({
        where: { id: trabalho.id },
        data: { progresso: Math.round(((indice + 1) / PERFIS.length) * 100) }
      });
      await banco.varianteHls.create({
        data: {
          arquivoId,
          altura: perfil.altura,
          taxaBits: perfil.taxaBits,
          // Nome do recurso, nao URL: quem monta a URL e quem assina, no /api/midia/playlist.
          playlist: `${perfil.altura}p.m3u8`
        }
      });
    }

    await writeFile(join(destino, 'mestre.m3u8'), playlistMestre(PERFIS), 'utf8');
    await banco.trabalhoProcessamento.update({
      where: { id: trabalho.id },
      data: { situacao: 'CONCLUIDO', progresso: 100 }
    });
  } catch (erro) {
    await banco.trabalhoProcessamento.update({
      where: { id: trabalho.id },
      data: {
        situacao: 'FALHOU',
        mensagem: erro instanceof Error ? erro.message : 'Erro no ffmpeg'
      }
    });
  }
}
