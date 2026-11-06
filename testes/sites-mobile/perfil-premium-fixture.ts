import type { Page } from '@playwright/test';
import { prepararChat } from './chat-fixture';
import { conquistas } from '../../versao-sites/lib/conquistas';
import {
  recompensasPerfil,
  visualPerfilPadrao
} from '../../versao-sites/lib/personalizacao-perfil';

export async function prepararPerfilPremium(
  page: Page,
  opcoes: { autenticado?: boolean; falharPrimeiro?: boolean } = {}
) {
  await prepararChat(page, { autenticado: opcoes.autenticado !== false });
  const ganhas = ['boas-vindas', 'primeira-colecao', 'primeiro-vinculo', 'primeiro-jogo'];
  const colecao = conquistas.map((c) => ({
    ...c,
    progresso: ganhas.includes(c.badgeId) ? c.meta : 0,
    obtidaEm: ganhas.includes(c.badgeId) ? 1700000000000 : null
  }));
  const painel = { conquistas: colecao, destaques: ganhas.slice(0, 3) };
  const foto = '/api/comunidade/imagens/00000000-0000-4000-8000-000000000001';
  const perfil = {
    id: 'qa-eu',
    nome: 'Akira da Comunidade',
    handle: 'akira_yokira',
    relacao: opcoes.autenticado === false ? 'nenhuma' : 'proprio',
    nivel: 20,
    xp: 1935,
    avatar: foto,
    banner: foto,
    bio: 'Animes, boas conversas e uma coleção de conquistas.',
    publico: true,
    mostrarConquistas: true,
    compartilharAtividade: false,
    atividade: null,
    criadoEm: 1700000000000,
    atualizadoEm: 1,
    visual: { ...visualPerfilPadrao, capa: 'sakura', moldura: 'prisma', aura: 'orbitas' },
    conquistas: colecao.filter((c) => painel.destaques.includes(c.badgeId))
  };
  const inventario = recompensasPerfil.map((item) => ({
    ...item,
    liberada: item.conquista
      ? ganhas.includes(item.conquista)
      : item.nivel
        ? item.nivel <= 20
        : true
  }));
  const gravacoes: Record<string, unknown>[] = [];
  await page.route('**/api/yokira**', async (rota) => {
    const req = rota.request(),
      acao = new URL(req.url()).searchParams.get('acao');
    if (req.method() === 'GET') {
      if (acao === 'perfil-social') return rota.fulfill({ json: { perfil, inventario } });
      if (acao === 'perfil-publico' || acao === 'cartao-perfil')
        return rota.fulfill({ json: { perfil: { ...perfil, acessivel: true } } });
      if (acao === 'conquistas') return rota.fulfill({ json: painel });
      if (acao === 'handle-disponivel')
        return rota.fulfill({ json: { disponivel: true, sugestao: perfil.handle } });
    }
    if (req.method() === 'POST') {
      const dados = req.postDataJSON() as Record<string, unknown>;
      if (dados.acao === 'salvar-perfil-social') {
        gravacoes.push(dados);
        if (opcoes.falharPrimeiro && gravacoes.length === 1)
          return rota.fulfill({
            status: 503,
            json: { erro: 'Conexão interrompida. Tente salvar novamente.' }
          });
        const { acao: ignorada, ...campos } = dados;
        void ignorada;
        Object.assign(perfil, campos, { atualizadoEm: perfil.atualizadoEm + 1 });
        return rota.fulfill({ json: { ok: true, perfil, inventario } });
      }
      if (dados.acao === 'equipar-conquistas') {
        painel.destaques = dados.destaques as string[];
        perfil.conquistas = painel.destaques.flatMap((id) =>
          colecao.filter((c) => c.badgeId === id)
        );
        return rota.fulfill({ json: painel });
      }
    }
    return rota.fallback();
  });
  return { perfil, inventario, gravacoes, painel };
}
