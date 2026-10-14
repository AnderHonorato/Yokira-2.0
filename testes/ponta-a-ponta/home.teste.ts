// Arquivo: testes/ponta-a-ponta/home.teste.ts
// Fidelidade e comportamento da home nas duas larguras.

import { expect, test } from '@playwright/test';

test('a home mostra hero e as tres trilhas', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('link', { name: 'Assistir agora' }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Populares' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Em alta' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Novidades' })).toBeVisible();
});

test('nao ha rolagem horizontal em 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const sobra = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(sobra).toBeLessThanOrEqual(1);
});

test('nenhum emoji na interface', async ({ page }) => {
  await page.goto('/');
  const texto = (await page.locator('body').innerText()) ?? '';
  // Faixas de pictogramas e emoticons do Unicode.
  expect(texto).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
});

test('os dots trocam o destaque do hero', async ({ page }) => {
  await page.goto('/');

  const primeiroTitulo = await page.locator('h1').first().innerText();
  await page.getByRole('tab').nth(1).click();
  await expect(page.locator('h1').first()).not.toHaveText(primeiroTitulo);
});
