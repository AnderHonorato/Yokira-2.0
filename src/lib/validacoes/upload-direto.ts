// Valida os metadados antes de ler o corpo de um upload grande.

import { extname } from 'node:path';

export const LIMITE_VIDEO_BYTES = 8 * 1024 * 1024 * 1024;
const EXTENSOES = new Set(['.mp4', '.mkv', '.mov', '.webm']);

export class ErroDeUpload extends Error {
  constructor(mensagem: string, public status = 400) {
    super(mensagem);
  }
}

export function validarUploadDireto(headers: Headers, origem: string): string {
  if (headers.get('origin') !== origem) {
    throw new ErroDeUpload('Origem não autorizada.', 403);
  }

  const tipo = headers.get('content-type')?.split(';', 1)[0].toLowerCase();
  if (tipo !== 'application/octet-stream' && !tipo?.startsWith('video/')) {
    throw new ErroDeUpload('Envie o arquivo como vídeo ou octet-stream.', 415);
  }

  const declarado = headers.get('content-length');
  if (declarado !== null) {
    if (!/^\d+$/.test(declarado) || Number(declarado) > LIMITE_VIDEO_BYTES) {
      throw new ErroDeUpload('Arquivo acima do limite permitido.', 413);
    }
  }

  const codificado = headers.get('x-nome-arquivo') ?? '';
  if (!codificado || codificado.length > 768) {
    throw new ErroDeUpload('Nome do arquivo inválido.');
  }

  let nome: string;
  try {
    nome = decodeURIComponent(codificado);
  } catch {
    throw new ErroDeUpload('Nome do arquivo inválido.');
  }

  if (
    nome.length > 255 ||
    [...nome].some((caractere) => caractere.charCodeAt(0) < 32 || caractere.charCodeAt(0) === 127) ||
    !EXTENSOES.has(extname(nome).toLowerCase())
  ) {
    throw new ErroDeUpload('Formato de vídeo não aceito.');
  }

  return nome;
}
