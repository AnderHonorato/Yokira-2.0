// Com BODY_SIZE_LIMIT alto apenas a rota de vídeo aceita corpos grandes.
// Pedidos comuns não devem usar request.json()/formData() para gigabytes.

const LIMITE_COMUM_BYTES = 8 * 1024 * 1024;

export interface RespostaDeLimite {
  codigo: 411 | 413;
  mensagem: string;
}

export function conferirLimiteDeRequisicao(
  metodo: string,
  caminho: string,
  headers: Headers
): RespostaDeLimite | null {
  if (metodo === 'GET' || metodo === 'HEAD' || metodo === 'OPTIONS') return null;
  if (caminho === '/api/admin/enviar-video' && metodo === 'POST') return null;

  const declarado = headers.get('content-length');
  if (declarado === null || !/^\d+$/.test(declarado)) {
    return { codigo: 411, mensagem: 'Informe o tamanho do corpo da requisição.' };
  }
  if (Number(declarado) > LIMITE_COMUM_BYTES) {
    return { codigo: 413, mensagem: 'O formulário excede o limite permitido.' };
  }
  return null;
}
