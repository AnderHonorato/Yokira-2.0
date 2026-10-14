// Arquivo: testes/ponta-a-ponta/navegacao.teste.ts

import { expect, test } from '@playwright/test';

test('barra inferior aparece no celular e some no desktop', async ({ page }, informacao) => {
  await page.goto('/');
  const barra = page.getByRole('navigation', { name: 'Navegação principal' });

  if (informacao.project.name === 'celular-390') {
    await expect(barra).toBeVisible();
    // Alvo de toque: no minimo 44px de altura.
    const caixa = await barra.getByRole('link').first().boundingBox();
    expect(caixa?.height ?? 0).toBeGreaterThanOrEqual(44);
  } else {
    await expect(barra).toBeHidden();
  }
});

test('clicar num card abre a pagina do titulo', async ({ page }) => {
  await page.goto('/catalogo');

  const primeiro = page.locator('a[href^="/titulo/"]').first();
  const destino = await primeiro.getAttribute('href');
  await primeiro.click();

  await expect(page).toHaveURL(new RegExp(`${destino}$`));
  await expect(page.getByRole('tab', { name: 'Episódios' })).toBeVisible();
});

test('a pagina de detalhes lista episodios e o painel lateral', async ({ page }) => {
  await page.goto('/catalogo');
  await page.locator('a[href^="/titulo/"]').first().click();

  await expect(page.getByRole('heading', { name: 'Trailers' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Mais episódios' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ver todos os episódios' })).toBeVisible();
  await expect(page.locator('a[href^="/assistir/"]').first()).toBeVisible();
});

test('trocar de aba mostra a sinopse completa', async ({ page }) => {
  await page.goto('/catalogo');
  await page.locator('a[href^="/titulo/"]').first().click();

  await page.getByRole('tab', { name: 'Sobre' }).click();
  await expect(page.getByRole('tab', { name: 'Sobre' })).toHaveAttribute('aria-selected', 'true');
});
