// Gera capas abstratas em SVG a partir do slug: cada título tem cor e composição próprias.
const MEDIDAS = { poster: [400, 600], banner: [1600, 640], ep: [640, 360] };

function hash(texto) {
  let h = 2166136261;
  for (const c of texto) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}
const escapar = (t) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function quebrarLinhas(texto, limite) {
  const linhas = [];
  let atual = '';
  for (const palavra of texto.split(' ')) {
    if ((atual + ' ' + palavra).trim().length > limite) { linhas.push(atual.trim()); atual = palavra; }
    else atual += ' ' + palavra;
  }
  if (atual.trim()) linhas.push(atual.trim());
  return linhas.slice(0, 3);
}

export function gerarCapa({ slug, titulo, tipo = 'poster', numero }) {
  const [w, h] = MEDIDAS[tipo] ?? MEDIDAS.poster;
  const n = hash(slug + (numero ?? ''));
  const matiz = n % 360;
  const matiz2 = (matiz + 40 + (n % 80)) % 360;
  const cx = (n % 70) + 15, cy = ((n >> 7) % 50) + 15, raio = ((n >> 3) % 25) + 18;
  const faixas = Array.from({ length: 7 }, (_, i) =>
    `<rect x="${-w + i * (w / 3)}" y="0" width="${w / 14}" height="${h * 2}" fill="hsl(${matiz2} 80% 70% / ${0.05 + (i % 3) * 0.03})" transform="rotate(${18 + (n % 20)} ${w / 2} ${h / 2})"/>`).join('');
  const linhas = tipo === 'poster' ? quebrarLinhas(titulo, 14) : [];
  const texto = linhas.map((l, i) =>
    `<text x="28" y="${h - 40 - (linhas.length - 1 - i) * 40}" font-family="Unbounded, Inter, sans-serif" font-size="32" font-weight="700" fill="#fff">${escapar(l)}</text>`).join('');
  const numeroEp = tipo === 'ep' && numero
    ? `<text x="${w - 24}" y="${h - 24}" text-anchor="end" font-family="Unbounded, Inter, sans-serif" font-size="96" font-weight="800" fill="#fff" fill-opacity=".22">${numero}</text>` : '';
  const r = (raio / 100) * Math.min(w, h);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${matiz} 70% 38%)"/><stop offset="1" stop-color="hsl(${matiz2} 65% 12%)"/></linearGradient>
<radialGradient id="l" cx="${cx}%" cy="${cy}%" r="60%"><stop offset="0" stop-color="hsl(${matiz2} 95% 75% / .55)"/><stop offset="1" stop-color="hsl(${matiz2} 95% 75% / 0)"/></radialGradient>
<linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".75"/></linearGradient>
</defs>
<rect width="${w}" height="${h}" fill="url(#g)"/><rect width="${w}" height="${h}" fill="url(#l)"/>${faixas}
<circle cx="${(cx / 100) * w}" cy="${(cy / 100) * h}" r="${r}" fill="none" stroke="hsl(${matiz2} 90% 85% / .35)" stroke-width="2"/>
<circle cx="${(cx / 100) * w}" cy="${(cy / 100) * h}" r="${r * 0.62}" fill="hsl(${matiz2} 90% 80% / .18)"/>
<rect width="${w}" height="${h}" fill="url(#s)"/>${texto}${numeroEp}
</svg>`;
}
