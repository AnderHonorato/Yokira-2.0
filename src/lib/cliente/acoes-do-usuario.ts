// Arquivo: src/lib/cliente/acoes-do-usuario.ts
// Chamadas da interface pro backend. Centralizado pra tratamento de erro e mensagem
// ficarem iguais em toda tela — e pra o componente nao ter fetch espalhado.

async function enviar<T>(caminho: string, corpo: unknown): Promise<T> {
  const resposta = await fetch(caminho, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(corpo)
  });

  if (resposta.status === 401) throw new Error('Entre na sua conta para salvar isso.');
  if (!resposta.ok) {
    const detalhe = await resposta.json().catch(() => null);
    throw new Error(detalhe?.message ?? 'Não foi possível concluir a ação.');
  }

  return resposta.json() as Promise<T>;
}

export function alternarLista(tituloId: string): Promise<{ naLista: boolean }> {
  return enviar('/api/minha-lista', { tituloId });
}

export function salvarProgressoNoServidor(episodioId: string, segundos: number) {
  return enviar<{ segundos: number }>('/api/progresso', { episodioId, segundos });
}

/** `nota: null` remove a avaliacao. Curtir e nota 10; descurtir e null. */
export function avaliar(tituloId: string, nota: number | null) {
  return enviar<{ media: number | null; total: number }>('/api/avaliacao', { tituloId, nota });
}

export function sinalizarAudiencia(episodioId: string, chave: string) {
  return enviar<{ assistindo: number }>('/api/audiencia', { episodioId, chave });
}

/** Passo 1 da dupla confirmacao: pega o token que o passo 2 vai gastar. */
export function pedirTokenDeConfirmacao(acao: string, alvo?: string) {
  return enviar<{ token: string }>('/api/confirmacao', { acao, alvo });
}
