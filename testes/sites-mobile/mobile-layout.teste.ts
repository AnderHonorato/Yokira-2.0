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
