import type { OperacaoAmizade } from './social';
export async function requisicaoSocial<T>(parametros: Record<string, string> | null, dados?: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
 const url = '/api/yokira' + (parametros ? '?' + new URLSearchParams(parametros) : '');
 const response = await fetch(url, dados ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dados), signal } : { cache: 'no-store', signal });
 const resultado = await response.json() as T & { erro?: string };
 if (!response.ok) throw new Error(resultado.erro || 'Não foi possível concluir esta ação.');
 return resultado;
}
export async function enviarAmizade(operacao: OperacaoAmizade, alvoId: string) {
 return requisicaoSocial(null, { acao: 'amizade', operacao, alvoId });
}
