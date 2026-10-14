// Arquivo: docs/medir-desempenho.mjs
// Mede o build de producao com 4G e CPU estrangulada. Rode com o servidor no ar:
//   npm run build && npm run iniciar   (em outra janela)
//   node docs/medir-desempenho.mjs
// Ajuste CHROMIUM_EXECUTAVEL se o navegador nao estiver no caminho padrao.

import { chromium } from 'playwright-core';

const BASE = 'http://localhost:4000';
const navegador = await chromium.launch(
  process.env.CHROMIUM_EXECUTAVEL ? { executablePath: process.env.CHROMIUM_EXECUTAVEL } : {}
);
const contexto = await navegador.newContext({ viewport: { width: 390, height: 844 } });

// A fonte e auto-hospedada; qualquer chamada a um CDN de fonte seria regressao.
// Bloquear aqui garante que a medicao nao dependa de terceiro nenhum.
await contexto.route('https://fonts.g*/**', (rota) => rota.abort());

const pagina = await contexto.newPage();
await pagina.addInitScript(() => {
  window.__lcp = 0;
  window.__cls = 0;
  new PerformanceObserver((lista) => {
    for (const e of lista.getEntries()) window.__lcp = e.startTime;
  }).observe({ type: 'largest-contentful-paint', buffered: true });
  new PerformanceObserver((lista) => {
    for (const e of lista.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
  }).observe({ type: 'layout-shift', buffered: true });
});

const sessao = await contexto.newCDPSession(pagina);
await sessao.send('Network.emulateNetworkConditions', {
  offline: false,
  downloadThroughput: (9 * 1024 * 1024) / 8,
  uploadThroughput: (1.5 * 1024 * 1024) / 8,
  latency: 170
});
await sessao.send('Emulation.setCPUThrottlingRate', { rate: 4 });

await pagina.goto(BASE, { waitUntil: 'load' });
await pagina.waitForTimeout(3000);

const m = await pagina.evaluate(() => {
  const nav = performance.getEntriesByType('navigation')[0];
  const fcp = performance.getEntriesByName('first-contentful-paint')[0];
  const bytes = performance
    .getEntriesByType('resource')
    .reduce((t, r) => t + (r.encodedBodySize || 0), 0);
  return {
    ttfb: Math.round(nav.responseStart),
    fcp: Math.round(fcp ? fcp.startTime : 0),
    lcp: Math.round(window.__lcp),
    cls: Number(window.__cls.toFixed(4)),
    domContentLoaded: Math.round(nav.domContentLoadedEventEnd),
    kbDeRecursos: Math.round(bytes / 1024)
  };
});
console.log('== primeiro acesso, 4G + CPU 4x mais lenta, 390px ==');
console.log(JSON.stringify(m, null, 2));

// Navegacao interna (SPA), que e o que o usuario sente ao clicar num link.
await pagina.locator('.barra-inferior a[href="/catalogo"]').click();
await pagina.waitForSelector('h1:has-text("Catálogo")');
const inicio = Date.now();
await pagina.locator('.barra-inferior a[href="/"]').click();
await pagina.waitForSelector('h2:has-text("Populares")');
console.log('== navegacao interna para pagina ja visitada ==');
console.log(Date.now() - inicio, 'ms');

// Resposta ao clique (INP aproximado): tempo ate a interface reagir.
await pagina.goto(BASE + '/catalogo', { waitUntil: 'load' });
const resposta = await pagina.evaluate(async () => {
  const alvo = document.querySelector('a[href^="/catalogo?genero="]');
  const t0 = performance.now();
  alvo.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
  await new Promise((r) => requestAnimationFrame(() => r()));
  return Math.round(performance.now() - t0);
});
console.log('== resposta visual ao toque (ms) ==');
console.log(resposta);

// Mesma navegacao interna sem estrangular a CPU, pra separar o custo do aparelho
// do custo do nosso codigo.
await sessao.send('Emulation.setCPUThrottlingRate', { rate: 1 });
await sessao.send('Network.emulateNetworkConditions', {
  offline: false,
  downloadThroughput: -1,
  uploadThroughput: -1,
  latency: 0
});
await pagina.goto(BASE, { waitUntil: 'load' });
await pagina.locator('.barra-inferior a[href="/catalogo"]').click();
await pagina.waitForSelector('h1:has-text("Catálogo")');
const inicioRapido = Date.now();
await pagina.locator('.barra-inferior a[href="/"]').click();
await pagina.waitForSelector('h2:has-text("Populares")');
console.log('== navegacao interna, sem estrangulamento de rede nem de CPU ==');
console.log(Date.now() - inicioRapido, 'ms');

await navegador.close();
