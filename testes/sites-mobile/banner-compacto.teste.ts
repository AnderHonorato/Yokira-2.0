import { expect, test } from '@playwright/test';

test('banner e abertura do celular ficam compactos e sem sobreposição', async ({ page }, info) => {
  for (const largura of [320, 390, 430]) {
    await page.setViewportSize({ width: largura, height: 844 });
    await page.goto('/');
    const intro = page.locator('.intro-main'),
      banner = page.locator('.banner-destaque');
    await expect(banner.locator('.banner-slide')).toBeVisible();
    const caixaIntro = (await intro.boundingBox())!;
    expect(caixaIntro.height).toBeLessThanOrEqual(260);
    await banner.scrollIntoViewIfNeeded();
    const caixa = (await banner.boundingBox())!;
    expect(caixa.height).toBeLessThanOrEqual(270);
    expect(caixa.width).toBeGreaterThan(caixa.height);
    const acao = banner.getByRole('button', { name: 'Assistir título' }),
      controles = banner.locator('.banner-controles');
    const botao = (await acao.boundingBox())!,
      barra = (await controles.boundingBox())!;
    expect(botao.y + botao.height).toBeLessThanOrEqual(barra.y);
    expect(botao.x).toBeGreaterThanOrEqual(caixa.x);
    expect(botao.x + botao.width).toBeLessThanOrEqual(caixa.x + caixa.width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      largura + 1
    );
    if (largura === 390 && info.project.name === 'celular-390')
      await page.screenshot({ path: info.outputPath('banner-mobile.png') });
  }
});
