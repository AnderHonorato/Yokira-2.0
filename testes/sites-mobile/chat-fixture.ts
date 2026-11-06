import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import type { MensagemChat } from '../../versao-sites/lib/chat';
import { conquistas } from '../../versao-sites/lib/conquistas';

const foto = '/api/comunidade/imagens/00000000-0000-4000-8000-000000000001';
export const pessoaChat = {
  id: 'pessoa-chat',
  nome: 'Participante QA',
  handle: 'participante_qa',
  nivel: 7,
  avatar: foto,
  relacao: 'nenhuma' as const
};
export function mensagemChat(id: string, dados: Partial<MensagemChat> = {}): MensagemChat {
  return {
    id,
    corpo: 'Conversa pública da comunidade.',
    criadoEm: Date.now(),
    autor: pessoaChat,
    imagem: null,
    sala: null,
    ...dados
  };
}
type Opcoes = { autenticado?: boolean; falharPrimeiro?: boolean; mensagens?: MensagemChat[] };
export async function prepararChat(page: Page, opcoes: Opcoes = {}) {
  const envios: Record<string, unknown>[] = [],
    entradas: Record<string, unknown>[] = [];
  const mensagens = [...(opcoes.mensagens ?? [mensagemChat('foto', { imagem: foto })])];
  const perfil = {
    ...pessoaChat,
    banner: foto,
    acessivel: true,
    bio: 'Histórias e boas conversas.',
    publico: true,
    mostrarConquistas: true,
    compartilharAtividade: true,
    xp: 625,
    criadoEm: Date.now() - 86400000,
    atualizadoEm: Date.now(),
    conquistas: [{ ...conquistas[0], progresso: 1, obtidaEm: Date.now() }],
    atividade: {
      tituloId: '1',
      titulo: 'Cowboy Bebop',
      episodioId: 'ep-qa',
      episodio: 3,
      atualizadoEm: Date.now()
    }
  };
  const imagem = readFileSync(
    new URL('../../versao-sites/public/marca/emblema-192.png', import.meta.url)
  );
  await page.route('**/api/comunidade/imagens/**', (rota) =>
    rota.fulfill({ contentType: 'image/png', body: imagem })
  );
  await page.route('**/api/yokira**', async (rota) => {
    const pedido = rota.request(),
      url = new URL(pedido.url());
    if (pedido.method() === 'POST') {
      const dados = pedido.postDataJSON() as Record<string, unknown>;
      if (dados.acao === 'chat-global-enviar') {
        envios.push(dados);
        if (opcoes.falharPrimeiro && envios.length === 1)
          return rota.fulfill({
            status: 503,
            json: { erro: 'Conexão interrompida. Tente novamente.' }
          });
        mensagens.push(
          mensagemChat(String(dados.requisicaoId), {
            corpo: String(dados.corpo || ''),
            autor: { ...pessoaChat, id: 'qa-eu', nome: 'Pessoa QA' }
          })
        );
        return rota.fulfill({ json: { ok: true, id: dados.requisicaoId } });
      }
      if (dados.acao === 'sala-entrar-chat') {
        entradas.push(dados);
        return rota.fulfill({ json: { salaId: 'sala-existente' } });
      }
      return rota.fulfill({ json: { ok: true } });
    }
    switch (url.searchParams.get('acao')) {
      case 'estado':
        return rota.fulfill({
          json: {
            usuario: opcoes.autenticado
              ? { id: 'qa-eu', nome: 'Pessoa QA', papel: 'membro', xp: 200, suspenso: false }
              : null,
            minhaLista: [],
            colecao: [],
            progresso: []
          }
        });
      case 'chat-global':
        return rota.fulfill({ json: { mensagens, servidorEm: Date.now() } });
      case 'cartao-perfil':
      case 'perfil-publico':
        return rota.fulfill({ json: { perfil } });
      case 'notificacoes':
        return rota.fulfill({ json: { notificacoes: [] } });
      case 'aparencia':
        return rota.fulfill({
          json: {
            aparencia: { cenario: 0, intensidade: 'suave', atualizadoEm: Number.MAX_SAFE_INTEGER }
          }
        });
      case 'sala':
        return rota.fulfill({ status: 404, json: { erro: 'Sala de teste sem reprodução.' } });
      default:
        return rota.fulfill({ json: {} });
    }
  });
  return { envios, entradas };
}
