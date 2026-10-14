// Arquivo: src/lib/cliente/acoes-criticas-cliente.ts
// Executa a acao ja confirmada. Note a ordem: primeiro pega o token do passo 1, depois
// chama a API com ele. Quem chamar a API sem token leva 400.

import { pedirTokenDeConfirmacao } from './acoes-do-usuario';
import { limparCachesDoNavegador } from './registrar-service-worker';
import { limparTudo } from './cache-sessao';
import type { AcaoCritica } from '$componentes/comum/acoes-criticas';

export async function executarAcaoCritica(acao: AcaoCritica): Promise<string> {
  if (acao.destino === 'navegador') {
    await Promise.all([limparTudo(), limparCachesDoNavegador()]);
    return 'Dados baixados removidos deste aparelho.';
  }

  const { token } = await pedirTokenDeConfirmacao(acao.chave);

  const resposta = await fetch('/api/conta', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ acao: acao.chave, tokenConfirmacao: token })
  });

  if (!resposta.ok) {
    const detalhe = await resposta.json().catch(() => null);
    throw new Error(detalhe?.message ?? 'Não foi possível concluir a ação.');
  }

  if (acao.chave === 'excluir-conta') {
    window.location.href = '/';
    return 'Conta excluída.';
  }

  return 'Ação concluída.';
}
