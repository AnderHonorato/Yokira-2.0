// Arquivo: testes/ponta-a-ponta/painel-admin.teste.ts
// O item 5.8: criar titulo, temporada e episodio pela interface, e provar que o que
// apaga passa pela dupla confirmacao — na tela E no servidor.

import { expect, test, type Page } from '@playwright/test';

const ADMIN = { email: 'admin@yokira.local', senha: 'YokiraAdmin#2024' };

async function entrarComoAdmin(page: Page) {
  await page.goto('/entrar');
  await page.getByLabel('E-mail').fill(ADMIN.email);
  await page.getByLabel('Senha').fill(ADMIN.senha);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL('/');
}

async function entrarComoEspectador(page: Page) {
  await page.goto('/cadastrar');
  await page.getByLabel('Nome').fill('Sem Poder');
  await page.getByLabel('E-mail').fill(`comum-${Date.now()}-${Math.random()}@yokira.local`);
  await page.getByLabel('Senha').fill('YokiraDemo2024');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page).toHaveURL('/');
}

function nomeUnico(): string {
  return `Teste ${Date.now()}-${Math.floor(Math.random() * 1e5)}`;
}

/**
 * Cria um titulo pelo formulario do painel e devolve o nome usado.
 * O formulario e escopado porque a busca da mesma tela tambem tem um campo cujo
 * rotulo casa com "Nome".
 */
async function criarTitulo(page: Page, sinopse: string): Promise<string> {
  const nome = nomeUnico();
  await page.goto('/admin/titulos');
  await page.getByRole('button', { name: 'Novo título' }).click();

  const forma = page.locator('form[action="?/criar"]');
  await forma.getByLabel('Nome').fill(nome);
  await forma.getByLabel('Sinopse').fill(sinopse);
  await forma.getByLabel('Ano').fill('2026');
  await forma.getByRole('button', { name: 'Criar título' }).click();

  await expect(page).toHaveURL(/\/admin\/titulos\/[a-z0-9]+$/);
  return nome;
}

test('espectador nao entra no painel', async ({ page }) => {
  await entrarComoEspectador(page);

  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Painel administrativo' })).toBeHidden();

  // E a API tambem recusa, nao so a tela.
  const resposta = await page.request.post('/api/admin', {
    data: { acao: 'excluir-titulo', alvo: 'qualquer', tokenConfirmacao: 'inventado' }
  });
  expect(resposta.status()).toBe(403);
});

test('criar titulo, temporada e episodio pela interface', async ({ page }) => {
  await entrarComoAdmin(page);

  // Redireciona pra edicao do titulo recem-criado.
  const nome = await criarTitulo(
    page,
    'Uma sinopse com folga suficiente para passar na validação.'
  );
  await expect(page.getByRole('heading', { name: nome })).toBeVisible();

  // Temporada
  const formaTemporada = page.locator('form[action="?/criarTemporada"]');
  await formaTemporada.getByLabel('Número').fill('1');
  await formaTemporada.getByLabel('Nome da temporada').fill('Primeira temporada');
  await formaTemporada.getByRole('button', { name: 'Adicionar temporada' }).click();
  await expect(page.getByRole('heading', { name: /T1 · Primeira temporada/ })).toBeVisible();

  // Episodio
  const formaEpisodio = page.locator('form[action="?/criarEpisodio"]');
  await formaEpisodio.getByLabel('Nº').fill('1');
  await formaEpisodio.getByLabel('Nome do episódio').fill('O primeiro passo');
  await formaEpisodio.getByRole('button', { name: 'Adicionar episódio' }).click();
  await expect(page.getByText('1. O primeiro passo')).toBeVisible();
  await expect(page.getByText('Sem vídeo').first()).toBeVisible();
});

test('temporada repetida e recusada com mensagem', async ({ page }) => {
  await entrarComoAdmin(page);

  await criarTitulo(page, 'Outra sinopse com tamanho suficiente para validar.');

  const forma = page.locator('form[action="?/criarTemporada"]');
  for (const vez of [1, 2]) {
    await forma.getByLabel('Número').fill('1');
    await forma.getByLabel('Nome da temporada').fill(`Tentativa ${vez}`);
    await forma.getByRole('button', { name: 'Adicionar temporada' }).click();
  }

  await expect(page.getByText('A temporada 1 ja existe neste titulo.')).toBeVisible();
});

test('excluir titulo exige digitar a palavra no passo 2', async ({ page }) => {
  await entrarComoAdmin(page);

  const nome = await criarTitulo(page, 'Sinopse do título que será excluído no teste.');

  await page.getByRole('button', { name: 'Excluir título' }).click();
  await expect(page.getByText('Passo 1 de 2')).toBeVisible();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByText('Passo 2 de 2')).toBeVisible();

  const confirmar = page.getByRole('button', { name: 'Confirmar' });
  await expect(confirmar).toBeDisabled();

  await page.getByLabel(/Digite/).fill('EXCLUIR');
  await expect(confirmar).toBeEnabled();
  await confirmar.click();

  // Esperar o aviso de conclusao, e nao a URL: a URL ja casava ANTES do clique,
  // entao a assercao passava na hora e o goto seguinte cancelava a requisicao de
  // exclusao ainda em voo. O teste "passava" sem nunca ter apagado nada.
  await expect(page.getByText('concluído')).toBeVisible();

  await page.goto('/admin/titulos');
  await expect(page.getByText(nome)).toBeHidden();
});

test('a API do painel recusa acao sem o token do passo 1', async ({ page }) => {
  await entrarComoAdmin(page);

  const resposta = await page.request.post('/api/admin', {
    data: { acao: 'excluir-titulo', alvo: 'algum-id', tokenConfirmacao: 'token-inventado' }
  });

  expect(resposta.status()).toBe(400);
});

test('nao da pra rebaixar o ultimo administrador', async ({ page }) => {
  await entrarComoAdmin(page);
  // Busca em vez de rolar a lista: com muitas contas cadastradas, a do admin
  // (a mais antiga) fica fora das 100 linhas mais recentes.
  await page.goto(`/admin/usuarios?busca=${encodeURIComponent(ADMIN.email)}`);

  const eu = page.locator('.admin-linha', { hasText: ADMIN.email });
  await eu.getByRole('combobox').selectOption('ESPECTADOR');

  await expect(page.getByText('Passo 1 de 2')).toBeVisible();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Confirmar' }).click();

  await expect(page.getByText('ultimo administrador')).toBeVisible();
});

test('o registro administrativo mostra o que foi feito', async ({ page }) => {
  await entrarComoAdmin(page);
  await page.goto('/admin/registro');

  await expect(page.getByRole('heading', { name: 'Registro administrativo' })).toBeVisible();
  await expect(page.locator('.admin-linha').first()).toBeVisible();
});
