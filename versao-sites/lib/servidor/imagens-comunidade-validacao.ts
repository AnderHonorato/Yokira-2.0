import { ErroApi } from './validacao';

export const LIMITE_IMAGEM = 4 * 1024 * 1024;
export type FinalidadeImagem = 'chat' | 'avatar' | 'banner';
export function cabecalhosImagem(request: Request) {
 if (request.headers.get('origin') !== new URL(request.url).origin || request.headers.get('sec-fetch-site') === 'cross-site')
  throw new ErroApi('Origem não permitida.', 403);
 const finalidade = request.headers.get('x-finalidade');
 if (finalidade !== 'chat' && finalidade !== 'avatar' && finalidade !== 'banner') throw new ErroApi('Finalidade de imagem inválida.');
 const mime = request.headers.get('content-type')?.toLowerCase().trim();
 if (!mime || !['image/jpeg', 'image/png', 'image/webp'].includes(mime)) throw new ErroApi('Escolha JPEG, PNG ou WebP.', 415);
 const declarados = ['content-length', 'x-tamanho-arquivo'].map(k => request.headers.get(k)).filter(v => v !== null);
 const tamanhos = declarados.map(v => /^\d+$/.test(v) ? Number(v) : NaN);
 if (tamanhos.some(n => !Number.isSafeInteger(n) || n < 1)) throw new ErroApi('Tamanho inválido.');
 if (tamanhos.some(n => n > LIMITE_IMAGEM)) throw new ErroApi('A imagem deve ter até 4 MiB.', 413);
 if (tamanhos.some(n => n !== tamanhos[0])) throw new ErroApi('Tamanho informado não corresponde ao envio.');
 return { finalidade, mime, esperado: tamanhos[0] };
}
export async function lerImagem(request: Request, esperado?: number) {
 if (!request.body) throw new ErroApi('Selecione uma imagem.');
 const leitor = request.body.getReader(), partes: Uint8Array[] = []; let tamanho = 0;
 try {
  for (;;) {
   const { done, value } = await leitor.read(); if (done) break;
   tamanho += value.byteLength;
   if (tamanho > LIMITE_IMAGEM || (esperado !== undefined && tamanho > esperado)) throw new ErroApi('A imagem excede o tamanho permitido.', 413);
   partes.push(value);
  }
 } catch (erro) { await leitor.cancel().catch(() => {}); throw erro; }
 finally { leitor.releaseLock(); }
 if (!tamanho || (esperado !== undefined && esperado !== tamanho)) throw new ErroApi('O envio está incompleto. Tente novamente.');
 const bytes = new Uint8Array(tamanho); let posicao = 0;
 for (const parte of partes) { bytes.set(parte, posicao); posicao += parte.byteLength; }
 return bytes;
}
const falha = (): never => { throw new ErroApi('Imagem inválida. Escolha JPEG, PNG ou WebP sem animação.', 415); };
const nome = (b: Uint8Array, inicio: number, fim: number) => String.fromCharCode(...b.subarray(inicio, fim));
function png(b: Uint8Array, v: DataView): [number, number] {
 if (b.length < 45 || nome(b, 1, 4) !== 'PNG' || b[0] !== 137 || nome(b, 4, 8) !== '\r\n\x1a\n') return falha();
 let p = 8, dados = false, fim = false;
 while (p + 12 <= b.length) {
  const n = v.getUint32(p), tipo = nome(b, p + 4, p + 8);
  if (p + n + 12 > b.length || (p === 8 && (tipo !== 'IHDR' || n !== 13)) || tipo === 'acTL') return falha();
  if ((tipo === 'IHDR' && p !== 8) || (tipo === 'PLTE' && (!n || n % 3 || n > 768))) return falha();
  if (tipo === 'IDAT' && n) dados = true;
  p += n + 12;
  if (tipo === 'IEND') { if (n || p !== b.length) return falha(); fim = true; break; }
 }
 const profundidades: Record<number, number[]> = { 0: [1, 2, 4, 8, 16], 2: [8, 16], 3: [1, 2, 4, 8], 4: [8, 16], 6: [8, 16] };
 if (!dados || !fim || !profundidades[b[25]]?.includes(b[24]) || b[26] || b[27] || b[28] > 1) return falha();
 return [v.getUint32(16), v.getUint32(20)];
}
function jpeg(b: Uint8Array, v: DataView): [number, number] {
 if (b.length < 12 || b[0] !== 255 || b[1] !== 216 || b.at(-2) !== 255 || b.at(-1) !== 217) return falha();
 let p = 2, dimensoes: [number, number] | undefined;
 while (p + 4 <= b.length) {
  if (b[p++] !== 255) return falha();
  while (b[p] === 255) p++;
  const marcador = b[p++];
  if (marcador === 218) {
   if (!dimensoes || p + 6 >= b.length || b[p + 2] < 1 || b[p + 2] > 4) return falha();
   const n = v.getUint16(p);
   if (n !== 6 + 2 * b[p + 2] || p + n >= b.length - 2) return falha();
   return dimensoes;
  }
  if (marcador === 216 || marcador === 217 || marcador === 0) return falha();
  if (p + 2 > b.length) return falha();
  const n = v.getUint16(p); if (n < 2 || p + n > b.length) return falha();
  if ([192, 193, 194].includes(marcador)) {
   if (n < 11 || n !== 8 + 3 * b[p + 7] || b[p + 2] !== 8 || ![1, 3, 4].includes(b[p + 7])) return falha();
   dimensoes = [v.getUint16(p + 5), v.getUint16(p + 3)];
  }
  p += n;
 }
 return falha();
}
function webp(b: Uint8Array, v: DataView): [number, number] {
 if (b.length < 30 || nome(b, 0, 4) !== 'RIFF' || nome(b, 8, 12) !== 'WEBP' || v.getUint32(4, true) + 8 !== b.length) return falha();
 let p = 12, dimensoes: [number, number] | undefined, tela: [number, number] | undefined;
 const u24 = (i: number) => b[i] + b[i + 1] * 256 + b[i + 2] * 65536;
 while (p + 8 <= b.length) {
  const tipo = nome(b, p, p + 4), n = v.getUint32(p + 4, true), d = p + 8;
  if (d + n > b.length || tipo === 'ANIM' || tipo === 'ANMF') return falha();
  if (tipo === 'VP8X') { if (n !== 10 || (b[d] & 2)) return falha(); tela = [u24(d + 4) + 1, u24(d + 7) + 1]; }
  if (tipo === 'VP8 ') {
   if (n < 10 || b[d] & 1 || nome(b, d + 3, d + 6) !== '\x9d\x01\x2a') return falha();
   dimensoes = [v.getUint16(d + 6, true) & 16383, v.getUint16(d + 8, true) & 16383];
  }
  if (tipo === 'VP8L') {
   if (n < 5 || b[d] !== 47 || b[d + 4] >> 5) return falha();
   dimensoes = [1 + b[d + 1] + ((b[d + 2] & 63) << 8), 1 + (b[d + 2] >> 6) + (b[d + 3] << 2) + ((b[d + 4] & 15) << 10)];
  }
  p = d + n + (n % 2);
 }
 if (p !== b.length || !dimensoes || (tela && (tela[0] !== dimensoes[0] || tela[1] !== dimensoes[1]))) return falha();
 return dimensoes;
}
export function validarBytesImagem(bytes: Uint8Array, mime: string) {
 const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
 const [largura, altura] = mime === 'image/png' ? png(bytes, v) : mime === 'image/jpeg' ? jpeg(bytes, v) : webp(bytes, v);
 if (!largura || !altura || largura > 4096 || altura > 4096 || largura * altura > 16000000)
  throw new ErroApi('A imagem deve ter até 4096 pixels por lado e 16 megapixels.', 413);
 return { largura, altura };
}
