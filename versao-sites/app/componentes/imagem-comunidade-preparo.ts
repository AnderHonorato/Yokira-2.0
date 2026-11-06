export type FinalidadeImagem = 'chat' | 'avatar' | 'banner';
export async function prepararImagem(arquivo: File, finalidade: FinalidadeImagem) {
 if (!['image/jpeg', 'image/png', 'image/webp'].includes(arquivo.type) || !arquivo.size || arquivo.size > 32 * 1024 * 1024)
  throw new Error('Escolha uma imagem JPEG, PNG ou WebP de até 32 MiB.');
 const imagem = await createImageBitmap(arquivo, { imageOrientation: 'from-image' });
 try {
  if (!imagem.width || !imagem.height || imagem.width * imagem.height > 64000000) throw new Error('Escolha uma imagem de até 64 megapixels.');
  const largura = finalidade === 'avatar' ? 320 : 1600, altura = finalidade === 'banner' ? 600 : largura;
  const escala = Math.min(1, largura / imagem.width, altura / imagem.height);
  const tela = document.createElement('canvas');
  tela.width = Math.max(1, Math.round(imagem.width * escala)); tela.height = Math.max(1, Math.round(imagem.height * escala));
  const contexto = tela.getContext('2d'); if (!contexto) throw new Error('Não foi possível preparar a imagem neste navegador.');
  contexto.drawImage(imagem, 0, 0, tela.width, tela.height);
  const blob = await new Promise<Blob>((resolver, rejeitar) => tela.toBlob(b => b ? resolver(b) : rejeitar(new Error('Não foi possível preparar a imagem.')), 'image/webp', 0.86));
  if (!['image/webp', 'image/png'].includes(blob.type) || blob.size > 4 * 1024 * 1024) throw new Error('A imagem ainda excede 4 MiB. Escolha uma imagem menor.');
  return new File([blob], blob.type === 'image/webp' ? 'imagem.webp' : 'imagem.png', { type: blob.type });
 } finally { imagem.close(); }
}
