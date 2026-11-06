import { expect, test } from '@playwright/test';

test('emblema grande e YOKIRA acompanham o título em todas as telas', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-1440', 'Matriz de tamanhos executada uma vez.');
  for (const largura of [320, 390, 430, 768, 1440, 3440]) {
    await page.setViewportSize({ width: largura, height: largura > 980 ? 1440 : 844 });
    await page.goto('/');
    const identidade = page.locator('.hero-identidade');
    const marca = identidade.locator('.marca-animada');
    const titulo = identidade.getByRole('heading', { name: 'Acervo de animes', exact: true });
    await expect(titulo).toBeVisible();
    await expect(identidade.getByText('YOKIRA', { exact: true })).toBeVisible();
    const icone = (await marca.boundingBox())!;
    const texto = (await titulo.boundingBox())!;
    expect(icone.width).toBeGreaterThanOrEqual(largura <= 600 ? 88 : 110);
    expect(icone.x + icone.width).toBeLessThanOrEqual(texto.x);
    expect(Math.max(icone.y, texto.y)).toBeLessThan(
      Math.min(icone.y + icone.height, texto.y + texto.height)
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      largura + 1
    );
    if (largura <= 430)
      expect((await page.locator('.intro-main').boundingBox())!.height).toBeLessThanOrEqual(260);
    if ([390, 1440, 3440].includes(largura))
      await page.screenshot({ path: info.outputPath(`marca-inicio-${largura}.png`), scale: 'css' });
  }
});
