// Arquivo: testes/ponta-a-ponta/recuperar-senha.teste.ts
// O item 5.5 de ponta a ponta: pedir o link, abrir o link que chegou por e-mail,
// trocar a senha e entrar com ela. Le a caixa de saida de arquivo pra seguir o link
// de verdade, em vez de supor que ele existe.

import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { CAIXA_DE_SAIDA } from '../../playwright.config';

interface EmailGravado {
  para: string;
  assunto: string;
  texto: string;
}

async function ultimoEmailPara(email: string): Promise<EmailGravado | null> {
  const conteudo = await readFile(CAIXA_DE_SAIDA, 'utf8').catch(() => '');
  const mensagens = conteudo
    .split('\n')
    .filter((linha) => linha.trim().length > 0)
    .map((linha) => JSON.parse(linha) as EmailGravado)
    .filter((mensagem) => mensagem.para === email);

  return mensagens.at(-1) ?? null;
}

function extrairLink(texto: string, rota: string): string {
  const encontrado = texto.split(/\s+/).find((parte) => parte.includes(rota));
  if (!encontrado) throw new Error(`Nenhum link de ${rota} no e-mail:\n${texto}`);
  return encontrado;
}

function emailUnico(prefixo: string): string {
  return `${prefixo}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@yokira.local`;
}

test('cadastro dispara o e-mail de confirmacao', async ({ page }) => {
  const email = emailUnico('verificar');

  await page.goto('/cadastrar');
  await page.getByLabel('Nome').fill('Pessoa Verificada');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill('YokiraDemo2024');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page).toHaveURL('/');

  await expect.poll(() => ultimoEmailPara(email), { timeout: 10_000 }).not.toBeNull();
  const mensagem = (await ultimoEmailPara(email))!;
  expect(mensagem.assunto).toContain('Confirme seu e-mail');

  // A conta ja entra usavel, mas as configuracoes cobram a confirmacao.
  await page.goto('/configuracoes');
  await expect(page.getByRole('heading', { name: 'E-mail não confirmado' })).toBeVisible();

  // Seguindo o link, a faixa some.
  await page.goto(extrairLink(mensagem.texto, '/verificar-email'));
  await expect(page.getByText('E-mail confirmado')).toBeVisible();

  await page.goto('/configuracoes');
  await expect(page.getByRole('heading', { name: 'E-mail não confirmado' })).toBeHidden();
});

test('recuperar a senha do inicio ao fim', async ({ page }) => {
  const email = emailUnico('recuperar');
  const senhaNova = 'YokiraNova2026';

  await page.goto('/cadastrar');
  await page.getByLabel('Nome').fill('Pessoa Esquecida');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill('YokiraDemo2024');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page).toHaveURL('/');

  // Sair pelo botao: /sair so aceita POST, entao um goto deixaria a sessao de pe
  // e a tela de recuperacao redirecionaria pra /configuracoes.
  await page.goto('/configuracoes');
  await page.getByRole('button', { name: 'Sair desta conta' }).click();
  await expect(page).toHaveURL('/');

  await page.goto('/recuperar-senha');
  await page.getByLabel('E-mail').fill(email);
  await page.getByRole('button', { name: 'Enviar link' }).click();
  await expect(page.getByText('já está a caminho')).toBeVisible();

  await expect
    .poll(async () => (await ultimoEmailPara(email))?.assunto ?? '', { timeout: 10_000 })
    .toContain('Redefinir sua senha');

  const mensagem = (await ultimoEmailPara(email))!;
  await page.goto(extrairLink(mensagem.texto, '/redefinir-senha'));

  await page.getByLabel('Nova senha').fill(senhaNova);
  await page.getByRole('button', { name: 'Salvar nova senha' }).click();

  await expect(page).toHaveURL(/\/entrar/);
  await expect(page.getByText('As outras sessões foram encerradas')).toBeVisible();

  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill(senhaNova);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL('/');
});

test('a tela nao conta quais e-mails existem', async ({ page }) => {
  await page.goto('/recuperar-senha');
  await page.getByLabel('E-mail').fill('nao-existe-mesmo@yokira.local');
  await page.getByRole('button', { name: 'Enviar link' }).click();

  // Mesmíssima resposta de quando a conta existe.
  await expect(page.getByText('já está a caminho')).toBeVisible();
});

test('link de redefinicao invalido nao mostra formulario', async ({ page }) => {
  await page.goto('/redefinir-senha?token=inventado');

  await expect(page.getByText('Este link expirou ou já foi usado')).toBeVisible();
  await expect(page.getByLabel('Nova senha')).toBeHidden();
});
