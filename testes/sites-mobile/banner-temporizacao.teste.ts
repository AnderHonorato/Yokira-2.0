import { expect, test, type Page } from '@playwright/test';
import { catalogo } from '../../versao-sites/lib/catalogo';

async function preparar(page: Page, intervalo = 10) {
  let consultas = 0;
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.route('**/api/yokira?acao=banners', (rota) => {
    consultas++;
    return rota.fulfill({
      json: {
        banners: catalogo.slice(0, 2).map((titulo, i) => ({
          id: `banner-tempo-${i}`,
          tituloId: titulo.id,
          titulo,
          imagem: '/marca/emblema-192.png',
          personagem: '',
          link: '',
          intervaloSegundos: intervalo,
          intervaloEfetivoSegundos: intervalo,
          ordem: i,
          ativo: true,
          atualizadoEm: 1
        }))
      }
    });
  });
  await page.goto('/');
  const banner = page.getByRole('region', { name: 'Animes em destaque' });
  await expect(banner.getByRole('heading', { name: catalogo[0].nome, exact: true })).toBeVisible();
  await banner.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await expect(banner).toHaveAttribute('data-pausado', 'false');
  return { banner, consultas: () => consultas };
}
const seletor = '.banner-paginacao button[aria-pressed=true] span';

test('pausa mantém o tempo da barra e o mesmo relógio determina a troca', async ({
  page
}, info) => {
  test.skip(info.project.name !== 'desktop-1440', 'Interação de hover verificada no desktop.');
  await page.clock.install();
  const { banner } = await preparar(page);
  await expect
    .poll(() => page.locator(seletor).evaluate((el) => el.getAnimations()[0]?.playState))
    .toBe('running');
  await banner.hover();
  await expect(banner).toHaveAttribute('data-pausado', 'true');
  await expect
    .poll(() => page.locator(seletor).evaluate((el) => el.getAnimations()[0]?.playState))
    .toBe('paused');
  await page.locator(seletor).evaluate((el) => {
    el.getAnimations()[0].currentTime = 3000;
  });
  await page.clock.fastForward(20000);
  expect(
    await page.locator(seletor).evaluate((el) => el.getAnimations()[0].currentTime)
  ).toBeCloseTo(3000, 1);
  expect(
    await page.locator(seletor).evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a)
  ).toBeCloseTo(0.3, 2);
  await page.mouse.move(0, 0);
  await expect
    .poll(() => page.locator(seletor).evaluate((el) => el.getAnimations()[0]?.playState))
    .toBe('running');
  const retomada = Number(
    await page.locator(seletor).evaluate((el) => el.getAnimations()[0].currentTime)
  );
  expect(retomada).toBeGreaterThanOrEqual(3000);
  expect(retomada).toBeLessThan(6000);
  await page.locator(seletor).evaluate((el) => el.getAnimations()[0].finish());
  await expect(banner.getByRole('heading', { name: catalogo[1].nome, exact: true })).toBeVisible();
});

test('consulta de sessenta segundos não reinicia destaque sem alterações', async ({
  page
}, info) => {
  test.skip(info.project.name !== 'desktop-1440', 'Relógio da consulta verificado uma vez.');
  await page.clock.install();
  const { banner, consultas } = await preparar(page, 60);
  await expect
    .poll(() => page.locator(seletor).evaluate((el) => el.getAnimations()[0]?.playState))
    .toBe('running');
  await page.locator(seletor).evaluate((el) => {
    const animacao = el.getAnimations()[0];
    animacao.currentTime = 27000;
    (window as Window & { relogioBannerTeste?: Animation }).relogioBannerTeste = animacao;
  });
  const anteriores = consultas();
  await page.clock.fastForward(60000);
  await expect.poll(consultas).toBeGreaterThan(anteriores);
  await expect(banner.getByRole('heading', { name: catalogo[0].nome, exact: true })).toBeVisible();
  expect(
    await page
      .locator(seletor)
      .evaluate(
        (el) =>
          el.getAnimations()[0] ===
          (window as Window & { relogioBannerTeste?: Animation }).relogioBannerTeste
      )
  ).toBe(true);
  expect(
    Number(await page.locator(seletor).evaluate((el) => el.getAnimations()[0].currentTime))
  ).toBeGreaterThanOrEqual(27000);
  // A escolha manual do mesmo destaque inicia um intervalo novo.
  await banner.getByRole('button', { name: `Mostrar ${catalogo[0].nome}`, exact: true }).click();
  expect(
    await page
      .locator(seletor)
      .evaluate(
        (el) =>
          el.getAnimations()[0] ===
          (window as Window & { relogioBannerTeste?: Animation }).relogioBannerTeste
      )
  ).toBe(false);
  expect(
    Number(await page.locator(seletor).evaluate((el) => el.getAnimations()[0].currentTime))
  ).toBeLessThan(1000);
});
