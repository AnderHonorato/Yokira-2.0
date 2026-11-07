import { expect, test } from '@playwright/test';
import { prepararPerfilPremium } from './perfil-premium-fixture';

test('perfil público apresenta capa, retrato, nível e hall sem overflow', async ({
  page
}, info) => {
  await prepararPerfilPremium(page, { autenticado: false });
  for (const largura of info.project.name === 'celular-390' ? [320, 390, 768] : [1440, 3440]) {
    await page.setViewportSize({ width: largura, height: largura > 980 ? 1440 : 900 });
    await page.goto('/?p=perfil-publico&handle=akira_yokira');
    const vitrine = page.locator('.perfil-vitrine');
    await expect(vitrine.getByRole('heading', { name: 'Akira da Comunidade' })).toBeVisible();
    await expect(vitrine).toHaveAttribute('data-capa', 'sakura');
    await expect(vitrine.locator('.perfil-retrato')).toHaveAttribute('data-moldura', 'prisma');
    const foto = (await vitrine.locator('.perfil-retrato').boundingBox())!;
    const capa = (await vitrine.locator('.perfil-vitrine-capa').boundingBox())!;
    expect(foto.y).toBeLessThan(capa.y + capa.height);
    expect(foto.y + foto.height).toBeGreaterThan(capa.y + capa.height);
    await expect(page.locator('.vitrine-premio')).toHaveCount(3);
    expect((await vitrine.boundingBox())!.height).toBeLessThanOrEqual(340);
    expect((await page.locator('.vitrine-destaques').boundingBox())!.height).toBeLessThanOrEqual(
      largura <= 600 ? 190 : 155
    );
    await expect(page.locator('.vitrine-premio-pedestal')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Editar destaques' })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      largura + 1
    );
    if ([390, 1440, 3440].includes(largura))
      await page.screenshot({
        path: info.outputPath(`perfil-publico-${largura}.png`),
        fullPage: true,
        scale: 'css'
      });
  }
});

test('personalização tem prévia, bloqueia recompensa e preserva rascunho após erro', async ({
  page
}, info) => {
  const { gravacoes } = await prepararPerfilPremium(page, { falharPrimeiro: true });
  await page.goto('/?p=perfil');
  await page.getByRole('button', { name: 'Personalizar perfil', exact: true }).click();
  const editor = page.locator('.perfil-editor');
  const astral = editor.getByRole('button', { name: /^Observatório astral/ });
  await expect(astral).toBeEnabled();
  await astral.click();
  await expect(page.locator('.perfil-vitrine')).toHaveAttribute('data-capa', 'astral');
  await expect(editor.getByRole('button', { name: /^Dragões do amanhecer/ })).toBeDisabled();
  await editor.getByRole('button', { name: /^Molduras/ }).click();
  await editor.getByRole('button', { name: /^Soberana/ }).click();
  await expect(page.locator('.perfil-vitrine')).toHaveAttribute('data-moldura', 'soberana');
  if (info.project.name === 'desktop-1440')
    await editor.screenshot({ path: info.outputPath('editor-personalizacao.png'), scale: 'css' });
  await editor.getByRole('button', { name: 'Salvar perfil', exact: true }).click();
  await expect(editor.getByRole('alert')).toContainText('Conexão interrompida');
  await expect(page.locator('.perfil-vitrine')).toHaveAttribute('data-capa', 'astral');
  await editor.getByRole('button', { name: 'Salvar perfil', exact: true }).click();
  await expect(editor.getByRole('status').filter({ hasText: 'Perfil salvo.' })).toBeVisible();
  expect(gravacoes).toHaveLength(2);
  expect(gravacoes[1].visual).toEqual({ capa: 'astral', moldura: 'soberana', aura: 'orbitas' });
  await page.reload();
  await expect(page.locator('.perfil-vitrine')).toHaveAttribute('data-capa', 'astral');
  if (info.project.name === 'desktop-1440')
    await page.screenshot({
      path: info.outputPath('perfil-proprio-personalizado.png'),
      fullPage: true,
      scale: 'css'
    });
});

test('hall filtra coleção e salva a ordem dos destaques', async ({ page }, info) => {
  const { painel } = await prepararPerfilPremium(page);
  await page.goto('/?p=perfil');
  const hall = page.getByRole('region', { name: 'Minha coleção de conquistas' });
  await hall.getByRole('button', { name: 'Obtidas', exact: true }).click();
  await expect(hall.locator('.hall-cartao')).toHaveCount(4);
  expect((await hall.locator('.hall-cartao').first().boundingBox())!.height).toBeLessThanOrEqual(
    96
  );
  await page.screenshot({
    path: info.outputPath('hall-compacto.png'),
    fullPage: true,
    scale: 'css'
  });
  await hall.getByRole('button', { name: 'Editar destaques', exact: true }).click();
  await hall
    .getByRole('button', { name: 'Mover Sua jornada começa para depois', exact: true })
    .click();
  await hall.getByRole('button', { name: 'Salvar destaques', exact: true }).click();
  await expect(hall.getByRole('button', { name: 'Editar destaques', exact: true })).toBeVisible();
  expect(painel.destaques[0]).toBe('primeira-colecao');
});

test('animações do perfil param com movimento reduzido', async ({ page }) => {
  await prepararPerfilPremium(page, { autenticado: false });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/?p=perfil-publico&handle=akira_yokira');
  const vitrine = page.locator('.perfil-vitrine');
  await expect(vitrine).toHaveAttribute('data-animado', 'true');
  await expect(vitrine.locator('.perfil-vitrine-aurora')).not.toHaveCSS('animation-name', 'none');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(vitrine).toHaveAttribute('data-animado', 'false');
  await expect(vitrine.locator('.perfil-vitrine-aurora')).toHaveCSS('animation-name', 'none');
});

test('edição mantém fotos e privacidade recolhidas até serem abertas', async ({ page }, info) => {
  await prepararPerfilPremium(page);
  await page.goto('/?p=perfil');
  await page.getByRole('button', { name: 'Personalizar perfil', exact: true }).click();
  const editor = page.locator('.perfil-editor');
  const secoes = editor.locator('.perfil-editor-expansivel');
  await expect(secoes).toHaveCount(2);
  for (const secao of await secoes.all()) await expect(secao).toHaveJSProperty('open', false);
  const fotos = secoes.first();
  await fotos.locator('summary').first().click();
  await expect(fotos.getByRole('heading', { name: 'Foto de perfil' })).toBeVisible();
  await fotos.locator('summary').first().click();
  await expect(fotos).toHaveJSProperty('open', false);
  if (info.project.name === 'desktop-1440')
    await editor.screenshot({ path: info.outputPath('editor-compacto.png'), scale: 'css' });
});
