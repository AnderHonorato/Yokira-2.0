// Arquivo: src/lib/servidor/midia/playlist-assinada.ts
// Troca cada URI interna da playlist por uma URL assinada, preservando o resto do
// arquivo linha a linha. O player nunca ve o nome cru do segmento, e toda linha vira
// um pedido que o servidor sabe conferir.

/** EXT-X-MAP, EXT-X-KEY e EXT-X-MEDIA escondem o endereco dentro de um atributo. */
const ATRIBUTO_URI = /URI="([^"]*)"/g;

/** Absoluta ou comecando com "//": e endereco de terceiro, nao e nosso pra assinar. */
function externa(uri: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/i.test(uri) || uri.startsWith('//');
}

export function reescreverPlaylist(texto: string, assinar: (interno: string) => string): string {
  return texto
    .split('\n')
    .map((linha) => {
      const limpa = linha.trim();
      if (limpa === '') return linha;

      if (limpa.startsWith('#')) {
        return linha.replace(ATRIBUTO_URI, (inteiro, uri: string) =>
          externa(uri) ? inteiro : `URI="${assinar(uri)}"`
        );
      }

      // Linha que nao e tag e endereco solto: ou vira assinada, ou nao e nossa.
      return externa(limpa) ? linha : assinar(limpa);
    })
    .join('\n');
}
