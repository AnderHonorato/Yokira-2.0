import { expect, test } from '@playwright/test';
import { prepararUploadsAdmin, responderUpload, urlEnviada } from './uploads-admin-fixture';

const imagem = { name: 'capa.png', mimeType: 'image/png', buffer: Buffer.from('imagem-qa') };
test('upload de pôster bloqueia salvar e selecionar outro título até concluir', async ({
  page
}) => {
  const { gravacoes } = await prepararUploadsAdmin(page);
  await page.goto('/?p=acervo-admin');
  await expect(page.getByLabel('Nome do título')).toBeVisible();
  await page
    .getByLabel('Motivo da alteração', { exact: true })
    .first()
    .fill('Atualização de capa.');
  const formulario = page.locator('.editor-acervo-form');
  await formulario.getByLabel('Selecionar imagem para enviar').first().setInputFiles(imagem);
  const salvar = formulario.getByRole('button', { name: 'Salvar alterações', exact: true });
  await expect(salvar).toBeDisabled();
  await expect(page.getByLabel('Selecionar para editar')).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Nova série', exact: true })).toBeDisabled();
  await responderUpload(page);
  await expect(page.getByLabel('Imagem do pôster', { exact: true })).toHaveValue(urlEnviada);
  await expect(salvar).toBeEnabled();
  await salvar.click();
  await expect.poll(() => gravacoes.length).toBe(1);
  expect((gravacoes[0].dados as Record<string, unknown>).poster).toBe(urlEnviada);
});

test('vídeo de episódio bloqueia fontes, temporada e seleção do título durante envio', async ({
  page
}) => {
  await prepararUploadsAdmin(page);
  await page.goto('/?p=acervo-admin');
  const editor = page.locator('.editor-temporadas');
  await editor.getByRole('button', { name: /1\. Episódio QA 1/ }).click();
  await editor.getByLabel('Motivo da alteração', { exact: true }).fill('Substituição do vídeo.');
  await editor.getByLabel('Selecionar vídeo para enviar').setInputFiles({
    name: 'episodio.mp4',
    mimeType: 'video/mp4',
    buffer: Buffer.from('video-qa')
  });
  await expect(editor.getByRole('button', { name: 'Salvar vídeo', exact: true })).toBeDisabled();
  await expect(editor.getByRole('button', { name: 'Remover fonte', exact: true })).toBeDisabled();
  await expect(editor.getByLabel('Tipo de reprodução')).toBeDisabled();
  await expect(page.getByLabel('Selecionar para editar')).toBeDisabled();
  await expect(editor.getByRole('button', { name: /2\. Episódio QA 2/ })).toBeDisabled();
  await expect(editor.getByRole('button', { name: 'Cancelar envio', exact: true })).toBeEnabled();
  await responderUpload(page);
  await expect(editor.getByLabel('URL do arquivo de vídeo')).toHaveValue(urlEnviada);
  await expect(page.getByLabel('Selecionar para editar')).toBeEnabled();
});

test('cancelar edição aborta upload do banner e resposta antiga não altera outro banner', async ({
  page
}) => {
  const { titulos } = await prepararUploadsAdmin(page);
  await page.goto('/?p=admin');
  await page.getByRole('button', { name: 'Banners', exact: true }).click();
  const lista = page.locator('.banners-lista');
  await lista.getByRole('button', { name: 'Editar', exact: true }).first().click();
  let formulario = page.locator('.banners-editor');
  await formulario.getByLabel('Selecionar imagem para enviar').first().setInputFiles(imagem);
  await expect(
    formulario.getByRole('button', { name: 'Salvar banner', exact: true })
  ).toBeDisabled();
  await expect(lista.getByRole('button', { name: 'Editar', exact: true }).last()).toBeDisabled();
  await formulario.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(lista.getByRole('button', { name: 'Editar', exact: true }).last()).toBeEnabled();
  await lista.getByRole('button', { name: 'Editar', exact: true }).last().click();
  formulario = page.locator('.banners-editor');
  await responderUpload(page);
  await expect(formulario.getByLabel('Imagem do cenário', { exact: true })).toHaveValue(
    titulos[1].capa
  );
  const abortado = await page.evaluate(
    () =>
      (window as unknown as { enviosMidiaTeste: { envios: { abortado: boolean }[] } })
        .enviosMidiaTeste.envios[0].abortado
  );
  expect(abortado).toBe(true);
});

test('timeout de upload libera o formulário preservando o endereço anterior', async ({ page }) => {
  const { titulos } = await prepararUploadsAdmin(page);
  await page.goto('/?p=acervo-admin');
  await expect(page.getByLabel('Imagem do pôster', { exact: true })).toBeVisible();
  await page
    .locator('.editor-acervo-form')
    .getByLabel('Selecionar imagem para enviar')
    .first()
    .setInputFiles(imagem);
  const tempo = await page.evaluate(() => {
    const estado = (
      window as unknown as {
        enviosMidiaTeste: { envios: { timeout: number }[]; expirar(i: number): void };
      }
    ).enviosMidiaTeste;
    const limite = estado.envios[0].timeout;
    estado.expirar(0);
    return limite;
  });
  expect(tempo).toBe(120000);
  await expect(
    page.getByText('O envio demorou demais. Tente novamente ou use uma URL externa.')
  ).toBeVisible();
  await expect(page.getByLabel('Selecionar para editar')).toBeEnabled();
  await expect(page.getByLabel('Imagem do pôster', { exact: true })).toHaveValue(titulos[0].poster);
});
