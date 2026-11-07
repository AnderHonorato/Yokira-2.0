import { expect, test } from '@playwright/test';
import { prepararChat } from './chat-fixture';

test('sino mostra amizade sem celebrar, marca leitura e abre a origem segura', async ({ page }) => {
  await prepararChat(page, { autenticado: true });
  const evento = {
    id: 'a'.repeat(32),
    tipo: 'amizade',
    titulo: 'Pedido de amizade recebido',
    descricao: 'Pessoa da comunidade enviou uma solicitação de amizade.',
    destino: '/?p=amizades&aba=recebidas',
    criadoEm: Date.now(),
    lidaEm: null as number | null,
    // Mesmo um dado legado sem flag não deve entrar na celebração de conquistas.
    celebradaEm: null,
    badgeId: null
  };
  const operacoes: Record<string, unknown>[] = [];
  await page.route('**/api/yokira**', async (rota) => {
    const pedido = rota.request(),
      url = new URL(pedido.url());
    if (pedido.method() === 'GET' && url.searchParams.get('acao') === 'notificacoes')
      return rota.fulfill({ json: { notificacoes: [evento] } });
    if (pedido.method() === 'GET' && url.searchParams.get('acao') === 'amizades')
      return rota.fulfill({
        json: { amigos: [], recebidas: [], enviadas: [], bloqueados: [], resultados: [] }
      });
    if (pedido.method() === 'POST') {
      const dados = pedido.postDataJSON() as Record<string, unknown>;
      if (dados.acao === 'notificacoes-ver') {
        operacoes.push(dados);
        if (dados.ler === true) evento.lidaEm ??= Date.now();
        return rota.fulfill({ json: { eventos: dados.ler === true ? [evento] : [] } });
      }
    }
    return rota.fallback();
  });
  await page.goto('/');
  const sino = page.getByRole('button', { name: 'Notificações: 1 não lidas', exact: true });
  await expect(sino).toBeVisible();
  await sino.click();
  const painel = page.getByRole('region', { name: 'Histórico de notificações' });
  await expect(painel).toContainText('Pedido de amizade recebido');
  await expect(painel).toContainText('/?p=amizades');
  await expect(page.locator('.notificacoes-celebracao')).toBeHidden();
  await painel.getByRole('button', { name: 'Marcar como lidas' }).click();
  await expect(page.getByRole('button', { name: 'Notificações', exact: true })).toBeVisible();
  await painel.getByRole('button', { name: /^Pedido de amizade recebido/ }).click();
  await expect(page).toHaveURL(
    (url) => url.searchParams.get('p') === 'amizades' && url.searchParams.get('aba') === 'recebidas'
  );
  await expect(page.getByRole('button', { name: /^Recebidas/ })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await expect(page.getByRole('heading', { name: 'Amizades', exact: true })).toBeVisible();
  expect(operacoes.length).toBeGreaterThan(0);
  expect(operacoes.every((dados) => dados.ler === true && dados.celebrar !== true)).toBe(true);
  expect(
    operacoes.every((dados) => JSON.stringify(dados.ids) === JSON.stringify([evento.id]))
  ).toBe(true);
  await expect(page.locator('.notificacoes-celebracao')).toBeHidden();
});
