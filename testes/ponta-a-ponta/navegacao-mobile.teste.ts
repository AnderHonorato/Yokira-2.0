// Navegação no alcance do polegar e capas inteiras em telas estreitas.

import { expect, test } from '@playwright/test';

test('no celular o menu fica embaixo, não duplicado no cabeçalho', async ({
  page
}, informacao) => {
  await page.goto('/');
  const inferior = page.getByRole('navigation', { name: 'Navegação principal' });
  const cabecalho = page.getByRole('navigation', { name: 'Seções do catálogo' });

  if (informacao.project.name === 'celular-390') {
    await expect(inferior).toBeVisible();
    await expect(cabecalho).toBeHidden();
    const area = await inferior.boundingBox();
    expect(area).not.toBeNull();
    expect(area!.y + area!.height).toBeGreaterThanOrEqual(389);

    const generos = inferior.getByRole('link', { name: 'Gêneros' });
    await expect(generos).toBeVisible();
    await generos.click();
    await expect(page).toHaveURL(/\/generos/);
  } else {
    await expect(inferior).toBeHidden();
    await expect(cabecalho).toBeVisible();
  }
});

test('dois cartões cabem inteiros na trilha sem corte lateral no celular', async ({
  page
}, informacao) => {
  test.skip(informacao.project.name !== 'celular-390', 'Layout exclusivo do celular');
  await page.goto('/');

  const trilha = page.locator('.carrossel-trilha').first();
  await expect(trilha).toBeVisible();
  const cartes = trilha.locator('.cartao');
  await expect(cartes.nth(1)).toBeVisible();

  const limite = await trilha.boundingBox();
  const primeiro = await cartes.nth(0).boundingBox();
  const segundo = await cartes.nth(1).boundingBox();
  expect(limite).not.toBeNull();
  expect(primeiro).not.toBeNull();
  expect(segundo).not.toBeNull();
  expect(primeiro!.x).toBeGreaterThanOrEqual(limite!.x - 1);
  expect(segundo!.x + segundo!.width).toBeLessThanOrEqual(limite!.x + limite!.width + 1);
});
