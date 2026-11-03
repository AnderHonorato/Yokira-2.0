// Arquivo: src/lib/servidor/armazenamento/gravar-upload.ts
// Grava o video fora de static/ (nada de expor original ao publico) e devolve o
// registro no banco. Quem transcodifica le daqui.
//
// A gravacao trabalha com bytes, nao com File: assim o mesmo caminho serve pro upload
// do formulario e pro video que veio de um link, sem duplicar limite nem validacao.

import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { banco } from '../banco/cliente.js';
import { gravarFluxoLimitado } from './fluxo-de-arquivo.js';

const EXTENSOES_ACEITAS = new Set(['.mp4', '.mkv', '.mov', '.webm']);
export const TAMANHO_MAXIMO_BYTES = 8 * 1024 * 1024 * 1024;

export function extensaoAceita(nome: string): boolean {
  return EXTENSOES_ACEITAS.has(extname(nome).toLowerCase());
}

export async function gravarBytes(episodioId: string, bytes: Buffer, nome: string) {
  if (!extensaoAceita(nome)) throw new Error('Formato de vídeo não aceito.');
  if (bytes.length === 0) throw new Error('Arquivo vazio.');
  if (bytes.length > TAMANHO_MAXIMO_BYTES) throw new Error('Arquivo acima do limite.');

  const pasta = process.env.PASTA_UPLOADS ?? './midia/originais';
  await mkdir(pasta, { recursive: true });

  // Nome sorteado: o nome de origem entraria num caminho de disco, e o do link vem
  // de fora. So a extensao, ja validada contra a lista fechada, sobrevive.
  const caminho = join(pasta, `${randomUUID()}${extname(nome).toLowerCase()}`);
  await writeFile(caminho, bytes);

  return banco.arquivoMidia.create({
    data: { episodioId, caminho, tamanhoBytes: bytes.length }
  });
}

/**
 * Transfere upload ou download diretamente para um arquivo privado, sem criar
 * buffers de varios gigabytes na memoria. So registra no banco apos concluir.
 */
export async function gravarFluxo(
  episodioId: string,
  fluxo: ReadableStream<Uint8Array>,
  nome: string
) {
  if (!extensaoAceita(nome)) throw new Error('Formato de vídeo não aceito.');

  const pasta = process.env.PASTA_UPLOADS ?? './midia/originais';
  await mkdir(pasta, { recursive: true });
  const caminho = join(pasta, `${randomUUID()}${extname(nome).toLowerCase()}`);
  const tamanhoBytes = await gravarFluxoLimitado(caminho, fluxo, TAMANHO_MAXIMO_BYTES);

  try {
    return await banco.arquivoMidia.create({
      data: { episodioId, caminho, tamanhoBytes }
    });
  } catch (erro) {
    await unlink(caminho).catch(() => {});
    throw erro;
  }
}

export async function gravarUpload(episodioId: string, arquivo: File) {
  if (arquivo.size > TAMANHO_MAXIMO_BYTES) throw new Error('Arquivo acima do limite.');
  return gravarFluxo(episodioId, arquivo.stream(), arquivo.name);
}
