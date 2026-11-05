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

test('fundo segue a configuração global e não oferece escolha ao visitante', async ({
  page,
  request
}) => {
  await page.clock.install({ time: new Date('2026-11-05T12:00:00Z') });
  let cenario = 4;
  await page.route('**/api/yokira?acao=aparencia', (rota) =>
    rota.fulfill({
      json: { aparencia: { cenario, intensidade: 'intenso', atualizadoEm: cenario + 1 } }
    })
  );
  await page.goto('/');
  const galeria = page.locator('.intro-cenarios');
  await expect(galeria).toHaveAttribute('data-cenario-atual', '4');
  await expect(page.locator('.cenarios-controles')).toHaveCount(0);
  await expect(page.getByLabel('Cenário animado')).toHaveCount(0);
  await page.clock.fastForward(3_600_000);
  await expect(galeria).toHaveAttribute('data-cenario-atual', '4');
  cenario = 7;
  await page.clock.fastForward(16_000);
  await expect(galeria).toHaveAttribute('data-cenario-atual', '7');
  const nomes = [
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
  ];
  for (const [indice, nome] of nomes.entries()) {
    const caminho = `/arte/cenarios/${String(indice + 1).padStart(2, '0')}-${nome}.webp`;
    const resposta = await request.get(caminho);
    expect(resposta.ok(), caminho).toBeTruthy();
    expect(resposta.headers()['content-type']).toContain('image/webp');
    expect((await resposta.body()).length).toBeGreaterThan(50_000);
  }
});

test('os cards em destaque cabem inteiramente no mobile, inclusive em 320px', async ({ page }) => {
  for (const largura of [320, 360, 390, 430, 768]) {
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

test('arte e atmosfera respeitam a preferência por menos animação', async ({ page }) => {
  await page.goto('/');
  const ilustracao = page.locator('.cenario-atual .cenario-ilustracao');
  await expect(ilustracao.locator('img')).toBeVisible();
  await expect(ilustracao).toHaveCSS('animation-name', 'cenario-cinematico');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(ilustracao).toHaveCSS('animation-name', 'none');
  await expect(page.locator('.cenario-atmosfera')).toBeHidden();
});
