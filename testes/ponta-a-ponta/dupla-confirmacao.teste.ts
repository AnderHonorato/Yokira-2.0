// Arquivo: testes/ponta-a-ponta/dupla-confirmacao.teste.ts
// Prova que o passo 2 realmente segura o botao — e que o servidor recusa sem o token.

import { expect, test } from '@playwright/test';

async function entrarComContaNova(page: import('@playwright/test').Page) {
  await page.goto('/cadastrar');
  await page.getByLabel('Nome').fill('Confirmação');
  await page.getByLabel('E-mail').fill(`conf-${Date.now()}-${Math.random()}@yokira.local`);
  await page.getByLabel('Senha').fill('YokiraDemo2024');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page).toHaveURL('/');
}

test('o botao de confirmar fica bloqueado ate o passo 2 ser cumprido', async ({ page }) => {
  await entrarComContaNova(page);
  await page.goto('/configuracoes');

  await page.getByRole('button', { name: 'Excluir conta' }).click();
  await expect(page.getByText('Passo 1 de 2')).toBeVisible();

  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByText('Passo 2 de 2')).toBeVisible();

  const confirmar = page.getByRole('button', { name: 'Confirmar' });
  await expect(confirmar).toBeDisabled();

  await page.getByLabel(/Digite/).fill('EXCLU');
  await expect(confirmar).toBeDisabled();

  await page.getByLabel(/Digite/).fill('EXCLUIR');
  await expect(confirmar).toBeEnabled();
});

test('a caixa de marcar tambem segura o botao', async ({ page }) => {
  await entrarComContaNova(page);
  await page.goto('/configuracoes');

  await page.getByRole('button', { name: 'Limpar histórico' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();

  const confirmar = page.getByRole('button', { name: 'Confirmar' });
  await expect(confirmar).toBeDisabled();

  await page.getByRole('checkbox').check();
  await expect(confirmar).toBeEnabled();
});

test('a API recusa a acao sem o token do passo 1', async ({ page }) => {
  await entrarComContaNova(page);

  const resposta = await page.request.post('/api/conta', {
    data: { acao: 'excluir-conta', tokenConfirmacao: 'token-inventado' }
  });

  expect(resposta.status()).toBe(400);
});

test('visitante nao consegue emitir token de confirmacao', async ({ page }) => {
  const resposta = await page.request.post('/api/confirmacao', {
    data: { acao: 'excluir-conta' }
  });
  expect(resposta.status()).toBe(401);
});
