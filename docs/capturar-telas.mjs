// Arquivo: docs/capturar-telas.mjs
// Gera as capturas de docs/capturas/ usadas na auditoria visual.
// Rode com o servidor de producao no ar: node docs/capturar-telas.mjs

import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:4000';
const navegador = await chromium.launch(
  process.env.CHROMIUM_EXECUTAVEL ? { executablePath: process.env.CHROMIUM_EXECUTAVEL } : {}
);

const telas = [
  ['home-mobile-390', '/', 390, 1400],
  ['home-mobile-360', '/', 360, 1400],
  ['home-desktop-1440', '/', 1440, 1100],
  ['detalhes-desktop-1440', null, 1440, 1100],
  ['detalhes-mobile-390', null, 390, 1400],
  ['catalogo-desktop-1440', '/catalogo', 1440, 1000],
  ['configuracoes-mobile-390', '/configuracoes', 390, 900]
];

for (const [nome, caminho, largura, altura] of telas) {
  const contexto = await navegador.newContext({
    viewport: { width: largura, height: altura },
    deviceScaleFactor: 2
  });
  const pagina = await contexto.newPage();
  if (caminho) {
    await pagina.goto(BASE + caminho, { waitUntil: 'networkidle' });
  } else {
    await pagina.goto(BASE + '/catalogo', { waitUntil: 'networkidle' });
    await pagina.locator('a[href^="/titulo/"]').first().click();
    await pagina.waitForLoadState('networkidle');
  }
  await pagina.waitForTimeout(400);
  await pagina.screenshot({ path: `docs/capturas/${nome}.png`, fullPage: false });
  console.log('capturado', nome);
  await contexto.close();
}

await navegador.close();
