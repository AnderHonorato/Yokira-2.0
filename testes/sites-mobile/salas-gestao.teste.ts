import { expect, test } from '@playwright/test';
import { prepararChat } from './chat-fixture';

test('dono consegue encerrar sala indisponível sem abrir player ou conversa', async ({ page }) => {
  await prepararChat(page, { autenticado: true });
  let encerrada = false;
  const operacoes: Record<string, unknown>[] = [];
  await page.route('**/api/yokira**', async (rota) => {
    const pedido = rota.request();
    const acao = new URL(pedido.url()).searchParams.get('acao');
    if (pedido.method() === 'GET' && acao === 'salas')
      return rota.fulfill({
        json: {
          salas: encerrada
            ? []
            : [
                {
                  id: 'sala-retirada',
                  tituloId: '1',
                  episodioId: 'retirado',
                  donoId: 'qa-eu',
                  modo: 'dupla',
                  participantes: 1,
                  trancada: false,
                  propria: true,
                  disponivel: false,
                  criadoEm: 1
                }
              ]
        }
      });
    if (pedido.method() === 'GET' && acao === 'episodios')
      return rota.fulfill({ json: { episodios: [] } });
    if (pedido.method() === 'POST') {
      const dados = pedido.postDataJSON() as Record<string, unknown>;
      if (dados.acao === 'sala-encerrar') {
        operacoes.push(dados);
        encerrada = true;
        return rota.fulfill({ json: { ok: true } });
      }
    }
    return rota.fallback();
  });
  await page.goto('/?p=salas');
  const lista = page.locator('.salas-lista');
  await expect(lista).toContainText('Conteúdo indisponível');
  await expect(lista.getByRole('button', { name: 'Abrir sala', exact: true })).toHaveCount(0);
  await lista.getByRole('button', { name: 'Encerrar sala', exact: true }).click();
  await expect(lista).toContainText('Você ainda não participa de uma sala ativa.');
  await expect(page.getByRole('status')).toContainText('Sala encerrada.');
  expect(operacoes).toEqual([{ acao: 'sala-encerrar', salaId: 'sala-retirada' }]);
});
