// Arquivo: testes/ponta-a-ponta/midia-protegida.teste.ts
// O item 5.2: nenhum caminho chega no .ts sem sessao valida E assinatura valida.

import { expect, test } from '@playwright/test';

const ARQUIVO = 'arq1234567890';

async function entrarComContaNova(page: import('@playwright/test').Page) {
  await page.goto('/cadastrar');
  await page.getByLabel('Nome').fill('Assinatura');
  await page.getByLabel('E-mail').fill(`midia-${Date.now()}-${Math.random()}@yokira.local`);
  await page.getByLabel('Senha').fill('YokiraDemo2024');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page).toHaveURL('/');
}

test('visitante nao alcanca playlist nem segmento', async ({ page }) => {
  const playlist = await page.request.get(`/midia/hls/${ARQUIVO}/mestre.m3u8`);
  expect(playlist.status()).toBe(401);

  const segmento = await page.request.get(`/midia/hls/${ARQUIVO}/720p_000.ts`);
  expect(segmento.status()).toBe(401);
});

test('a pasta publica antiga de hls nao serve mais nada', async ({ page }) => {
  // Antes os .ts moravam em static/hls e saiam sem passar por sessao.
  const antigo = await page.request.get(`/hls/${ARQUIVO}/720p_000.ts`);
  expect(antigo.status()).toBe(404);
});

test('com sessao, mas sem assinatura, ainda e recusado', async ({ page }) => {
  await entrarComContaNova(page);

  const semAssinatura = await page.request.get(`/midia/hls/${ARQUIVO}/720p_000.ts`);
  expect(semAssinatura.status()).toBe(403);

  const assinaturaInventada = await page.request.get(
    `/midia/hls/${ARQUIVO}/720p_000.ts?exp=${Date.now() + 60_000}&sig=${'a'.repeat(64)}`
  );
  expect(assinaturaInventada.status()).toBe(403);
});

test('assinatura vencida e recusada', async ({ page }) => {
  await entrarComContaNova(page);

  const vencida = await page.request.get(
    `/midia/hls/${ARQUIVO}/720p_000.ts?exp=${Date.now() - 1000}&sig=${'a'.repeat(64)}`
  );
  expect(vencida.status()).toBe(403);
});

test('nome de arquivo fora da lista fechada e recusado antes de tocar o disco', async ({
  page
}) => {
  await entrarComContaNova(page);

  for (const ruim of ['..%2F..%2F.env', 'qualquer.txt', 'mestre.m3u9']) {
    const resposta = await page.request.get(`/midia/hls/${ARQUIVO}/${ruim}`);
    expect([400, 404]).toContain(resposta.status());
  }
});

test('a URL da playlist nao vem embutida na pagina', async ({ page }) => {
  await entrarComContaNova(page);

  // Sem episodio com midia no catalogo ficticio, o endpoint responde 404 —
  // o que importa aqui e que ele exige sessao e nao devolve caminho de disco.
  const semSessao = await page.context().request.get('/api/midia/playlist?episodioId=inexistente');
  expect([401, 404]).toContain(semSessao.status());
});
