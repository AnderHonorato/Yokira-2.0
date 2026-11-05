import { expect, test } from '@playwright/test';

for (const autenticado of [false, true]) {
  test(`o cabeçalho completo cabe em cada tela ${autenticado ? 'com' : 'sem'} sessão`, async ({
    page
  }) => {
    await page.route('**/api/yokira?acao=estado', (rota) =>
      rota.fulfill({
        json: {
          usuario: autenticado ? { id: 'layout', nome: 'Teste', xp: 0, nivel: 1 } : null,
          minhaLista: [],
          colecao: [],
          progresso: []
        }
      })
    );
    await page.route('**/api/yokira?acao=notificacoes', (rota) =>
      rota.fulfill({ json: { notificacoes: [] } })
    );
    for (const largura of [320, 360, 390, 430, 768, 981, 1440]) {
      await page.setViewportSize({ width: largura, height: 900 });
      await page.goto('/');
      const header = page.locator('.topbar');
      const barra = page.getByRole('navigation', { name: 'Navegação inferior' });
      const menu = page.getByRole('navigation', { name: 'Navegação principal' });
      const sino = header.getByRole('button', { name: /^Notificações/ });
      if (autenticado) {
        await expect(sino).toHaveCount(1);
        await expect(sino).toBeVisible();
        await expect(page.locator('.notificacoes')).toHaveCount(1);
      } else await expect(header.getByRole('link', { name: 'Entrar', exact: true })).toBeVisible();
      await expect(header.getByRole('button', { name: 'Buscar animes' })).toBeVisible();
      await expect(header.getByRole('button', { name: 'Alternar tema' })).toBeVisible();
      await expect(header.getByRole('button', { name: 'Meu perfil' })).toBeVisible();
      const topo = (await header.boundingBox())!;
      if (largura <= 980) {
        await expect(barra).toBeVisible();
        await expect(menu).toBeHidden();
        const inferior = (await barra.boundingBox())!;
        expect(topo.y, `${largura}: cabeçalho deve ficar embaixo`).toBeGreaterThan(450);
        expect(Math.abs(topo.y + topo.height - inferior.y)).toBeLessThanOrEqual(1);
        expect(Math.abs(inferior.y + inferior.height - 900)).toBeLessThanOrEqual(1);
      } else {
        await expect(menu).toBeVisible();
        await expect(barra).toBeHidden();
        expect(topo.y).toBe(0);
      }
      const controles = await page
        .locator('.topbar button, .topbar a, .mobile-bottom-nav a, .mobile-bottom-nav button')
        .evaluateAll((elementos) =>
          elementos
            .filter((elemento) => elemento.getClientRects().length > 0)
            .map((elemento) => {
              const r = elemento.getBoundingClientRect();
              const sobreposto = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
              return {
                x: r.x,
                direita: r.right,
                largura: r.width,
                altura: r.height,
                livre: sobreposto === elemento || elemento.contains(sobreposto)
              };
            })
        );
      for (const controle of controles) {
        expect(controle.x, `${largura}: controle à esquerda`).toBeGreaterThanOrEqual(-1);
        expect(controle.direita, `${largura}: controle à direita`).toBeLessThanOrEqual(largura + 1);
        expect(controle.livre, `${largura}: controle obstruído`).toBeTruthy();
        if (largura <= 980) {
          expect(controle.largura, `${largura}: alvo estreito`).toBeGreaterThanOrEqual(44);
          expect(controle.altura, `${largura}: alvo baixo`).toBeGreaterThanOrEqual(44);
        }
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        largura + 1
      );
    }
  });
}

test('a cobra percorre as siglas em camadas e respeita movimento reduzido', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.route('**/api/yokira?acao=aparencia', (rota) =>
    rota.fulfill({
      json: {
        aparencia: { cenario: 0, intensidade: 'intenso', atualizadoEm: Number.MAX_SAFE_INTEGER }
      }
    })
  );
  await page.goto('/');
  const marca = page.locator('.topbar .marca-animada');
  await expect(marca).toBeVisible();
  await expect(marca.locator('.marca-siglas path')).toHaveCount(3);
  await expect(marca.locator('.marca-cobra-atras')).toHaveCount(1);
  await expect(marca.locator('.marca-cobra-frente')).toHaveAttribute('mask', /^url\(#.+\)$/);
  const corpo = marca.locator('.marca-cobra-atras .marca-cobra-corpo');
  const cabeca = marca.locator('.marca-cobra-atras .marca-cobra-cabeca');
  await expect(corpo).toHaveCSS('animation-name', 'marca-serpentear');
  await expect(cabeca).toHaveCSS('animation-name', 'marca-cabeca');
  expect(await cabeca.evaluate((elemento) => getComputedStyle(elemento).offsetPath)).toContain(
    'path('
  );
  const posicao = await cabeca.evaluate((elemento) => getComputedStyle(elemento).offsetDistance);
  await expect
    .poll(() => cabeca.evaluate((elemento) => getComputedStyle(elemento).offsetDistance))
    .not.toBe(posicao);
  const traco = await corpo.evaluate((elemento) => getComputedStyle(elemento).strokeDashoffset);
  await expect
    .poll(() => corpo.evaluate((elemento) => getComputedStyle(elemento).strokeDashoffset))
    .not.toBe(traco);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(corpo).toHaveCSS('animation-name', 'none');
  await expect(cabeca).toHaveCSS('animation-name', 'none');
  await expect(marca).toBeVisible();
});

test('a página inicial não exibe os slogans removidos', async ({ page }) => {
  await page.goto('/');
  const frases = [
    /um novo capítulo começa aqui/i,
    /todo anime é um/i,
    /encontre sua próxima história favorita/i,
    /feito para quem vive anime/i,
    /vale cada episódio/i,
    /uma pausa entre episódios/i,
    /seu lado otaku joga aqui/i,
    /o que vale descobrir/i,
    /histórias que ficam com você/i,
    /nenhuma história é solo/i,
    /toda história merece/i,
    /cultive boas histórias/i,
    /made for anime lovers/i
  ];
  for (const frase of frases) await expect(page.locator('body')).not.toContainText(frase);
});
