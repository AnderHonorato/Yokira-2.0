// Arquivo: testes/ponta-a-ponta/conta-e-lista.teste.ts
// O fluxo que mais importa: cadastrar, adicionar na lista, recarregar e a lista continuar la.

import { expect, test } from '@playwright/test';

function emailUnico(): string {
  return `teste-${Date.now()}-${Math.floor(Math.random() * 1e6)}@yokira.local`;
}

test('cadastrar, entrar e sair', async ({ page }) => {
  await page.goto('/cadastrar');

  await page.getByLabel('Nome').fill('Pessoa de Teste');
  await page.getByLabel('E-mail').fill(emailUnico());
  await page.getByLabel('Senha').fill('YokiraDemo2024');
  await page.getByRole('button', { name: 'Criar conta' }).click();

  await expect(page).toHaveURL('/');

  await page.goto('/configuracoes');
  await expect(page.getByRole('heading', { name: 'Configurações' })).toBeVisible();

  await page.getByRole('button', { name: 'Sair desta conta' }).click();
  await expect(page).toHaveURL('/');
});

test('senha fraca e recusada com mensagem', async ({ page }) => {
  await page.goto('/cadastrar');

  await page.getByLabel('Nome').fill('Pessoa de Teste');
  await page.getByLabel('E-mail').fill(emailUnico());
  await page.getByLabel('Senha').fill('123');
  await page.getByRole('button', { name: 'Criar conta' }).click();

  await expect(page.getByRole('alert')).toBeVisible();
});

// Fluxo longo (cadastro + navegacao + recarga): o teto padrao de 30s fica apertado.
test('minha lista persiste depois de recarregar', async ({ page }) => {
  test.setTimeout(90_000);

  await page.goto('/cadastrar');
  await page.getByLabel('Nome').fill('Lista Persistente');
  await page.getByLabel('E-mail').fill(emailUnico());
  await page.getByLabel('Senha').fill('YokiraDemo2024');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page).toHaveURL('/');

  await page.goto('/catalogo');
  await page.locator('a[href^="/titulo/"]').first().click();

  await page.getByRole('button', { name: /Minha Lista/ }).click();
  await expect(page.getByRole('button', { name: 'Na Minha Lista' })).toBeVisible();

  await page.reload();
  await page.goto('/minha-lista');
  await expect(page.locator('a[href^="/titulo/"]').first()).toBeVisible();
});

test('visitante sem conta ve o convite para entrar', async ({ page }) => {
  await page.goto('/minha-lista');
  // exact: o avatar do cabecalho tambem aponta pra /entrar.
  await expect(page.getByRole('link', { name: 'Entrar', exact: true })).toBeVisible();
});
