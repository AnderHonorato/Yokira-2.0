// Arquivo: src/lib/servidor/armazenamento/gravar-upload.ts
// Grava o video fora de static/ (nada de expor original ao publico) e devolve o
// registro no banco. Quem transcodifica le daqui.
//
// A gravacao trabalha com bytes, nao com File: assim o mesmo caminho serve pro upload
// do formulario e pro video que veio de um link, sem duplicar limite nem validacao.

import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { banco } from '../banco/cliente.js';

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

export async function gravarUpload(episodioId: string, arquivo: File) {
  if (arquivo.size > TAMANHO_MAXIMO_BYTES) throw new Error('Arquivo acima do limite.');
  return gravarBytes(episodioId, Buffer.from(await arquivo.arrayBuffer()), arquivo.name);
}
