import { expect, test } from '@playwright/test';
import { mensagemChat, prepararChat } from './chat-fixture';

test('desktop e ultrawide aproveitam a tela com cartões limitados e sem rolagem lateral', async ({
  page
}, info) => {
  test.skip(info.project.name !== 'desktop-1440', 'Matriz de desktop executada uma vez.');
  await prepararChat(page);
  for (const largura of [1920, 2560, 3440]) {
    await page.setViewportSize({ width: largura, height: 1440 });
    await page.goto('/?p=catalogo');
    await expect(page.locator('.anime-grid.catalog-grid .anime-card').first()).toBeVisible();
    const caixa = (await page.locator('.main-container').boundingBox())!;
    expect(caixa.width, `${largura}: largura útil`).toBeGreaterThanOrEqual(largura * 0.9);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      largura + 1
    );
    const cartoes = await page.locator('.catalog-grid .anime-card').evaluateAll((lista) =>
      lista.map((el) => {
        const r = el.getBoundingClientRect();
        return { largura: r.width, esquerda: r.left, direita: r.right };
      })
    );
    expect(cartoes.length).toBeGreaterThan(6);
    for (const cartao of cartoes) {
      expect(cartao.largura).toBeLessThanOrEqual(301);
      expect(cartao.esquerda).toBeGreaterThanOrEqual(caixa.x - 1);
      expect(cartao.direita).toBeLessThanOrEqual(caixa.x + caixa.width + 1);
    }
    if (largura === 3440)
      await page.screenshot({ path: info.outputPath('catalogo-3440x1440.png'), scale: 'css' });
  }
});

test('chat público fica encostado à direita, abre, recolhe e preserva a barra mobile', async ({
  page
}, info) => {
  await prepararChat(page);
  for (const largura of [320, 390, 844, 3440]) {
    const altura = largura === 3440 ? 1440 : 844;
    await page.setViewportSize({ width: largura, height: altura });
    await page.goto('/');
    const chat = page.getByRole('complementary', { name: 'Chat global' });
    const controle = chat.getByRole('button', { name: 'Abrir chat global' });
    await expect(controle).toBeVisible();
    await expect(controle).toContainText('Chat global');
    let caixa = (await chat.boundingBox())!;
    expect(Math.abs(caixa.x + caixa.width - largura)).toBeLessThanOrEqual(1);
    await controle.click();
    await expect(chat.getByRole('log')).toContainText('Conversa pública da comunidade.');
    await expect(
      chat.getByText('Entre na sua conta para conversar e compartilhar fotos.')
    ).toBeVisible();
    await expect(chat.getByLabel('Sua mensagem')).toHaveCount(0);
    await expect(
      chat.getByRole('img', { name: 'Foto compartilhada por Participante QA' })
    ).toBeVisible();
    caixa = (await chat.boundingBox())!;
    expect(caixa.x).toBeGreaterThanOrEqual(0);
    expect(caixa.y).toBeGreaterThanOrEqual(0);
    expect(Math.abs(caixa.x + caixa.width - largura)).toBeLessThanOrEqual(1);
    if (largura <= 980) {
      const barra = (await page.locator('.topbar').boundingBox())!;
      expect(caixa.y + caixa.height).toBeLessThanOrEqual(barra.y);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      largura + 1
    );
    if (largura !== 320)
      await page.screenshot({
        path: info.outputPath(`chat-publico-${largura}x${altura}.png`),
        scale: 'css'
      });
    await chat.getByRole('button', { name: 'Recolher chat global' }).click();
    await expect(chat.getByRole('button', { name: 'Abrir chat global' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    await expect(chat.getByRole('log')).toBeHidden();
  }
});

test('erro de envio preserva texto e nova tentativa reutiliza o mesmo identificador', async ({
  page
}) => {
  const fixture = await prepararChat(page, { autenticado: true, falharPrimeiro: true });
  await page.goto('/');
  await page.getByRole('button', { name: 'Abrir chat global' }).click();
  const editor = page.getByLabel('Sua mensagem');
  await expect(editor).toBeVisible();
  const literal = '<script>texto literal</script>';
  await editor.fill(literal);
  await page
    .locator('.chat-global-editor')
    .getByRole('button', { name: 'Enviar', exact: true })
    .click();
  await expect(page.getByRole('alert')).toContainText('Conexão interrompida');
  await expect(editor).toHaveValue(literal);
  await page
    .locator('.chat-global-editor')
    .getByRole('button', { name: 'Enviar', exact: true })
    .click();
  await expect(editor).toHaveValue('');
  await expect(page.getByRole('log')).toContainText(literal);
  expect(fixture.envios).toHaveLength(2);
  expect(fixture.envios[0].requisicaoId).toBe(fixture.envios[1].requisicaoId);
  expect(fixture.envios[0].corpo).toBe(literal);
  expect(fixture.envios[0].requisicaoId).toMatch(/^[a-f0-9-]{36}$/);
  await expect(page.locator('.chat-global-corpo script')).toHaveCount(0);
});

test('nome e avatar abrem cartão com nível, conquista, atividade e acesso ao perfil', async ({
  page
}, info) => {
  test.skip(info.project.name !== 'desktop-1440', 'Hover verificado no desktop.');
  await prepararChat(page, { autenticado: true });
  await page.goto('/');
  await page.getByRole('button', { name: 'Abrir chat global' }).click();
  const autor = page.getByRole('button', { name: 'Ver perfil de Participante QA' });
  await expect(autor.locator('img')).toBeVisible();
  await autor.hover();
  const cartao = page.getByRole('dialog', { name: 'Perfil de Participante QA', exact: true });
  await expect(cartao).toBeVisible();
  await expect(cartao).toContainText('Nível 7');
  await expect(cartao.getByRole('img', { name: 'Sua jornada começa, Comum' })).toBeVisible();
  await expect(cartao).toContainText('Assistindo agora');
  await expect(cartao).toContainText('Cowboy Bebop · Episódio 3');
  const caixa = (await cartao.boundingBox())!;
  expect(caixa.x).toBeGreaterThanOrEqual(0);
  expect(caixa.x + caixa.width).toBeLessThanOrEqual(1440);
  await cartao.getByRole('button', { name: 'Ver perfil completo' }).click();
  await expect(page).toHaveURL(
    (url) =>
      url.searchParams.get('p') === 'perfil-publico' &&
      url.searchParams.get('handle') === 'participante_qa'
  );
  await expect(page.getByRole('heading', { name: 'Participante QA' })).toBeVisible();
});

test('salas trancadas ou encerradas bloqueiam entrada e participante atual pode abrir', async ({
  page
}) => {
  const sala = {
    id: 'sala-existente',
    titulo: 'Cowboy Bebop',
    participantes: 2,
    capacidade: 12,
    trancada: true,
    encerrada: false,
    participante: false
  };
  const fixture = await prepararChat(page, {
    autenticado: true,
    mensagens: [
      mensagemChat('trancada', { sala }),
      mensagemChat('encerrada', { sala: { ...sala, encerrada: true } }),
      mensagemChat('participante', { sala: { ...sala, participante: true } })
    ]
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Abrir chat global' }).click();
  const chat = page.getByRole('complementary', { name: 'Chat global' });
  await expect(chat.getByRole('button', { name: 'Sala trancada', exact: true })).toBeDisabled();
  await expect(chat.getByRole('button', { name: 'Sala encerrada', exact: true })).toBeDisabled();
  await chat.getByRole('button', { name: 'Abrir sala', exact: true }).click();
  await expect(page).toHaveURL(
    (url) =>
      url.searchParams.get('p') === 'sala' && url.searchParams.get('salaId') === 'sala-existente'
  );
  expect(fixture.entradas).toEqual([{ acao: 'sala-entrar-chat', mensagemId: 'participante' }]);
});
