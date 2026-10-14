// Arquivo: src/lib/cliente/acoes-administrativas.ts
// Mesma ordem do /configuracoes: pega o token do passo 1 e so entao chama a API.
// O alvo vai nas duas chamadas — token emitido pra um item nao serve pra outro.

import { pedirTokenDeConfirmacao } from './acoes-do-usuario';

export async function executarAcaoAdministrativa(
  acao: string,
  alvo: string,
  extras: Record<string, string> = {}
): Promise<void> {
  const { token } = await pedirTokenDeConfirmacao(acao, alvo);

  const resposta = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ acao, alvo, tokenConfirmacao: token, ...extras })
  });

  if (!resposta.ok) {
    const detalhe = (await resposta.json().catch(() => null)) as { message?: string } | null;
    throw new Error(detalhe?.message ?? 'Não foi possível concluir a ação.');
  }
}
