// Arquivo: src/lib/visual/posters/gerar-poster.ts
// Poster procedural em SVG. Existe porque nao versionamos arte de terceiros:
// o seed precisa de uma imagem plausivel e o admin troca depois pelo arquivo real.
// Deterministico de proposito — o mesmo slug gera sempre o mesmo poster, entao o cache funciona.

const PALETAS: ReadonlyArray<readonly [string, string, string]> = [
  ['#2b1055', '#7c3aed', '#f0abfc'],
  ['#0f172a', '#1d4ed8', '#38bdf8'],
  ['#3b0764', '#a21caf', '#fb7185'],
  ['#052e16', '#15803d', '#a3e635'],
  ['#450a0a', '#b91c1c', '#fbbf24'],
  ['#0c1222', '#334155', '#94a3b8']
];

/** Hash estavel e minusculo. Nao precisa ser criptografico, so espalhar bem. */
export function semear(texto: string): number {
  let acumulado = 2166136261;
  for (let i = 0; i < texto.length; i += 1) {
    acumulado ^= texto.charCodeAt(i);
    acumulado = Math.imul(acumulado, 16777619);
  }
  return Math.abs(acumulado);
}

export function paletaDo(slug: string): readonly [string, string, string] {
  return PALETAS[semear(slug) % PALETAS.length];
}

// O nome NAO e desenhado dentro da arte. A interface ja mostra o titulo em cima
// (hero) ou embaixo (card), entao o texto no SVG aparecia duas vezes na mesma peca —
// e, recortado em 16:9, virava uma marca d'agua enorme atravessando a capa.
// O `rotulo` continua no aria-label, que e onde ele serve pra alguma coisa.
export function svgDoPoster(slug: string, rotulo: string, largura = 400, altura = 600): string {
  const [fundo, meio, brilho] = paletaDo(slug);
  const semente = semear(slug);

  // Tudo proporcional ao quadro, e nao em pixels fixos: o mesmo gerador agora
  // atende poster em pe (2:3) e arte deitada (16:9) sem virar dois desenhos.
  const menorLado = Math.min(largura, altura);
  const centroDoBrilho = altura * (0.3 + (semente % 18) / 100);
  const raioDoBrilho = menorLado * 0.62;
  const inclinacao = altura * (0.04 + (semente % 9) / 100);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${largura} ${altura}" width="${largura}" height="${altura}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${escapar(rotulo)}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0%" stop-color="${fundo}" />
      <stop offset="58%" stop-color="${meio}" />
      <stop offset="100%" stop-color="${fundo}" />
    </linearGradient>
    <radialGradient id="b" cx="0.5" cy="${(centroDoBrilho / altura).toFixed(3)}" r="0.62">
      <stop offset="0%" stop-color="${brilho}" stop-opacity="0.85" />
      <stop offset="100%" stop-color="${brilho}" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="${largura}" height="${altura}" fill="url(#g)" />
  <ellipse cx="${largura / 2}" cy="${centroDoBrilho.toFixed(1)}" rx="${(raioDoBrilho * (largura / menorLado) * 0.72).toFixed(1)}" ry="${raioDoBrilho.toFixed(1)}" fill="url(#b)" />
  <path d="M0 ${altura} L${largura} ${(altura - inclinacao).toFixed(1)} L${largura} ${altura} Z" fill="${fundo}" opacity="0.75" />
</svg>`;
}

/** Proporcao deitada, para o hero e para as capas do desktop. */
export function arteLargaEmDataUri(slug: string, rotulo: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgDoPoster(slug, rotulo, 1280, 720))}`;
}

export function posterEmDataUri(slug: string, rotulo: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgDoPoster(slug, rotulo))}`;
}

function escapar(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
