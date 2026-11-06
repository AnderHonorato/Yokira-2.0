import { expect, test, type Page } from '@playwright/test';
import { prepararChat } from './chat-fixture';

async function efeitosIntensos(page: Page) {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.route('**/api/yokira?acao=aparencia', (rota) =>
    rota.fulfill({
      json: {
        aparencia: { cenario: 0, intensidade: 'intenso', atualizadoEm: Number.MAX_SAFE_INTEGER }
      }
    })
  );
}

test('nível reutiliza a marca original com cobra em movimento e respeita redução', async ({
  page
}) => {
  await prepararChat(page, { autenticado: true });
  await efeitosIntensos(page);
  await page.goto('/?p=perfil');
  const nivel = page.locator('.perfil-resumo .emblema-nivel');
  await expect(nivel).toBeVisible();
  await expect(nivel).toHaveAttribute('data-marca-original', 'true');
  const marca = nivel.locator('.marca-animada');
  await expect(marca).toHaveAttribute('data-original', '/marca/emblema-192.png');
  await expect(marca).toHaveAttribute('data-animado', 'true');
  const corpo = marca.locator('.marca-cobra-original');
  const anterior = await corpo.evaluate((el) => getComputedStyle(el).transform);
  await expect
    .poll(() => corpo.evaluate((el) => getComputedStyle(el).transform))
    .not.toBe(anterior);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(nivel).toHaveAttribute('data-animado', 'false');
  await expect(marca).toHaveAttribute('data-animado', 'false');
  await expect(marca.locator('animate')).toHaveCount(0);
});

test('destaques do perfil e do cartão público animam somente enquanto visíveis', async ({
  page
}) => {
  await prepararChat(page, { autenticado: true });
  await efeitosIntensos(page);
  await page.setViewportSize({ width: 390, height: 500 });
  await page.goto('/?p=perfil-publico&handle=participante_qa');
  const destaque = page.locator('.social-destaques .emblema-conquista');
  await destaque.scrollIntoViewIfNeeded();
  await expect(destaque).toHaveAttribute('data-animado', 'true');
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(destaque).toHaveAttribute('data-animado', 'false');
  await page.goto('/');
  await page.getByRole('button', { name: 'Abrir chat global' }).click();
  await page.getByRole('button', { name: 'Ver perfil de Participante QA' }).focus();
  const cartao = page.getByRole('dialog', { name: 'Perfil de Participante QA', exact: true });
  await expect(cartao.locator('.emblema-conquista')).toHaveAttribute('data-animado', 'true');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(cartao.locator('.emblema-conquista')).toHaveAttribute('data-animado', 'false');
});

test('camadas do cenário pausam fora da tela e retomam ao voltar', async ({ page }) => {
  await efeitosIntensos(page);
  await page.goto('/');
  const cenario = page.locator('.intro-cenarios');
  await expect(cenario).toHaveAttribute('data-pausado', 'false');
  const ilustracao = cenario.locator('.cenario-atual .cenario-ilustracao');
  await expect(ilustracao).toHaveCSS('animation-play-state', 'running');
  await page.locator('.footer').scrollIntoViewIfNeeded();
  await expect(cenario).toHaveAttribute('data-pausado', 'true');
  await expect(ilustracao).toHaveCSS('animation-play-state', 'paused');
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(cenario).toHaveAttribute('data-pausado', 'false');
  await expect(ilustracao).toHaveCSS('animation-play-state', 'running');
});
