// Verificação de layout em navegador real da versão pública React/Vinext.

import { expect, test } from '@playwright/test';

test('a navegação ocupa o rodapé no celular e o cabeçalho no desktop', async ({
  page
}, informacao) => {
  await page.goto('/');
  const barra = page.getByRole('navigation', { name: 'Navegação inferior' });
  const menuTopo = page.getByRole('navigation', { name: 'Navegação principal' });

  if (informacao.project.name === 'celular-390') {
    await expect(barra).toBeVisible();
    await expect(menuTopo).toBeHidden();

    const rect = await barra.boundingBox();
    expect(rect).not.toBeNull();
    expect(rect!.y + rect!.height).toBeGreaterThanOrEqual(page.viewportSize()!.height - 1);

    await barra.getByRole('button', { name: 'Mais seções' }).click();
    const painel = page.getByRole('navigation', { name: 'Outras seções' });
    await expect(painel).toBeVisible();
    await painel.getByRole('link', { name: 'Fórum' }).click();
    await expect(page).toHaveURL(/\?p=forum/);
    await expect(painel).toBeHidden();
  } else {
    await expect(menuTopo).toBeVisible();
    await expect(barra).toBeHidden();
  }
});

test('o catálogo encaixa cards completos sem transbordamento horizontal', async ({
  page
}, informacao) => {
  await page.goto('/?p=catalogo');
  const grade = page.locator('.anime-grid.catalog-grid');
  await expect(grade).toBeVisible();

  const largura = await page.evaluate(() => ({
    documento: document.documentElement.scrollWidth,
    visivel: document.documentElement.clientWidth
  }));
  expect(largura.documento).toBeLessThanOrEqual(largura.visivel + 1);

  if (informacao.project.name === 'celular-390') {
    const caixa = await grade.boundingBox();
    const cards = grade.locator('.anime-card');
    await expect(cards.nth(1)).toBeVisible();
    const primeiro = await cards.nth(0).boundingBox();
    const segundo = await cards.nth(1).boundingBox();

    expect(caixa).not.toBeNull();
    expect(primeiro).not.toBeNull();
    expect(segundo).not.toBeNull();
    expect(primeiro!.x).toBeGreaterThanOrEqual(caixa!.x - 1);
    expect(segundo!.x + segundo!.width).toBeLessThanOrEqual(caixa!.x + caixa!.width + 1);
  }
});

test('pontos verdes têm animação suave e respeitam movimento reduzido', async ({ page }) => {
  await page.goto('/');
  const ponto = page.locator('.live-dot').first();
  await expect(ponto).toBeVisible();
  await expect(ponto).toHaveCSS('animation-name', 'yokira-ponto-luz');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(ponto).toHaveCSS('animation-name', 'none');
});

test('galeria anime usa dez artes próprias e alterna na virada de cada hora', async ({
  page,
  request
}) => {
  const inicio = new Date('2026-11-04T14:59:58.000Z');
  await page.clock.install({ time: inicio });
  await page.goto('/');

  const galeria = page.locator('.intro-cenarios');
  await expect(galeria).toBeVisible();
  const indiceAnterior = Math.floor(inicio.getTime() / 3_600_000) % 10;
  await expect(galeria).toHaveAttribute('data-cenario-atual', String(indiceAnterior));
  const fundoAnterior = await page
    .locator('.cenario-atual .cenario-ilustracao')
    .evaluate((elemento) => getComputedStyle(elemento).backgroundImage);

  await page.clock.fastForward(4_000);
  const indiceSeguinte = (indiceAnterior + 1) % 10;
  await expect(galeria).toHaveAttribute('data-cenario-atual', String(indiceSeguinte));
  const proximo = await page
    .locator('.cenario-atual .cenario-ilustracao')
    .evaluate((elemento) => getComputedStyle(elemento).backgroundImage);
  expect(proximo).not.toEqual(fundoAnterior);

  for (const numero of Array.from({ length: 10 }, (_, i) => i + 1)) {
    const nome = [
      'sakura-luar',
      'metropole-chuva',
      'ilhas-celestes',
      'expresso-crepusculo',
      'templo-de-neve',
      'areias-do-destino',
      'floresta-espiritos',
      'observatorio-astral',
      'palacio-submerso',
      'dragoes-do-amanhecer'
    ][numero - 1];
    const caminho = `/arte/cenarios/${String(numero).padStart(2, '0')}-${nome}.svg`;
    const resultado = await request.get(caminho);
    expect(resultado.ok(), `Faltou cenário ${caminho}`).toBeTruthy();
    expect(await resultado.text()).toContain('<svg');
  }
});

test('o que vale descobrir cabe inteiramente no mobile, inclusive em 320px', async ({ page }) => {
  for (const largura of [320, 360, 390, 430]) {
    await page.setViewportSize({ width: largura, height: 800 });
    await page.goto('/');
    const secao = page.locator('.trending-section');
    await expect(secao).toBeVisible();
    const resultado = await page.evaluate(() => {
      const secao = document.querySelector('.trending-section');
      const cards = Array.from(secao?.querySelectorAll('.anime-card') ?? []);
      const box = secao!.getBoundingClientRect();
      const larguraUtil = document.documentElement.clientWidth;
      return {
        rolagem: document.documentElement.scrollWidth,
        larguraUtil,
        cards: cards.map((card) => {
          const rect = card.getBoundingClientRect();
          return { esquerda: rect.left, direita: rect.right, largura: rect.width };
        }),
        limite: box.right
      };
    });
    expect(resultado.rolagem, `Rolagem horizontal em ${largura}px`).toBeLessThanOrEqual(
      largura + 1
    );
    expect(resultado.cards.length).toBeGreaterThan(1);
    for (const card of resultado.cards) {
      expect(card.esquerda, `Card saiu à esquerda em ${largura}px`).toBeGreaterThanOrEqual(-1);
      expect(card.direita, `Card saiu à direita em ${largura}px`).toBeLessThanOrEqual(
        resultado.larguraUtil + 1
      );
      expect(card.direita, 'Card saiu da seção').toBeLessThanOrEqual(resultado.limite + 1);
    }
  }
});

test('ilustração em loop respeita a preferência por menos animação', async ({ page }) => {
  await page.goto('/');
  const ilustracao = page.locator('.cenario-atual .cenario-ilustracao');
  await expect(ilustracao).toBeVisible();
  await expect(ilustracao).toHaveCSS('animation-name', 'yokira-cenario-respirar');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(ilustracao).toHaveCSS('animation-name', 'none');
});
