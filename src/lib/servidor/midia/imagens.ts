// Arquivo: src/lib/servidor/midia/imagens.ts
// Reconhece a imagem pelos primeiros bytes, nao pela extensao. Extensao e so o que o
// navegador do outro lado resolveu escrever no nome: um .png pode chegar com HTML
// dentro, e esse HTML voltaria depois pela nossa propria origem.

export type FormatoDeImagem = 'jpg' | 'png' | 'webp';

export const TAMANHO_MAXIMO_DA_IMAGEM = 8 * 1024 * 1024;

export const TIPO_POR_FORMATO: Record<FormatoDeImagem, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp'
};

function comeca(bytes: Uint8Array, assinatura: number[], deslocamento = 0): boolean {
  if (bytes.length < deslocamento + assinatura.length) return false;
  return assinatura.every((valor, indice) => bytes[deslocamento + indice] === valor);
}

/** Formato real do conteudo, ou `null` quando nao e imagem que a gente aceita. */
export function formatoDaImagem(bytes: Uint8Array): FormatoDeImagem | null {
  if (comeca(bytes, [0xff, 0xd8, 0xff])) return 'jpg';
  if (comeca(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';

  // WebP e um contêiner RIFF: "RIFF" no inicio e "WEBP" logo depois do tamanho.
  if (comeca(bytes, [0x52, 0x49, 0x46, 0x46]) && comeca(bytes, [0x57, 0x45, 0x42, 0x50], 8)) {
    return 'webp';
  }

  return null;
}

/** Nome de arquivo aceito na pasta de capas. Lista fechada, como a do HLS. */
export function nomeDeCapaValido(nome: string): boolean {
  return /^[a-f0-9]{32}\.(jpg|png|webp)$/.test(nome);
}
