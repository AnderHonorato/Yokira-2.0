// Valida o upload binário real pelo painel e a barreira de autenticação.

import { expect, test } from '@playwright/test';

test('visitante não consegue gravar vídeo por URL direta', async ({ page }) => {
  const resposta = await page.request.post('/api/admin/enviar-video?episodioId=inexistente', {
    headers: {
      origin: new URL(test.info().project.use.baseURL!).origin,
      'content-type': 'application/octet-stream',
      'x-nome-arquivo': encodeURIComponent('teste.mp4')
    },
    data: Buffer.from('conteúdo binário')
  });
  expect(resposta.status()).toBe(401);
});

test('painel envia um arquivo em fluxo e mostra feedback', async ({ page }) => {
  await page.goto('/entrar');
  await page.getByLabel('E-mail').fill('admin@yokira.local');
  await page.getByLabel('Senha').fill('YokiraAdmin#2024');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL('/');

  await page.goto('/admin/enviar');
  await expect(page.getByRole('heading', { name: 'Enviar episódio' })).toBeVisible();

  await page.locator('input[name="arquivo"]').setInputFiles({
    name: 'prova-stream.mp4',
    mimeType: 'video/mp4',
    buffer: Buffer.from('Arquivo fictício pequeno para testar a transferência.')
  });

  await page.locator('form.conta-forma').getByRole('button', { name: 'Enviar' }).click();
  await expect(page.locator('.admin-envio-mensagem')).toContainText(
    'Vídeo recebido para conversão HLS.',
    { timeout: 20_000 }
  );

  // O player não recebe vídeo falso; o transcodificador registrará falha.
  await expect(page.getByRole('button', { name: 'Enviar' })).toBeEnabled();
});
