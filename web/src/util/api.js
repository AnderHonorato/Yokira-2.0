// Cliente da API: token de login, cache de GETs e assinatura do chat em tempo real
const cache = new Map();
let token = null;
try { token = localStorage.getItem('yokira:token'); } catch { /* sem armazenamento */ }

export function definirToken(novo) {
  token = novo;
  cache.clear();
  try { novo ? localStorage.setItem('yokira:token', novo) : localStorage.removeItem('yokira:token'); } catch { /* idem */ }
}
const cabecalhos = () => ({ 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) });

export async function buscar(caminho, { semCache = false } = {}) {
  if (!semCache && cache.has(caminho)) return cache.get(caminho);
  const resposta = await fetch(`/api${caminho}`, { headers: cabecalhos() });
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(dados.erro || `Falha ao carregar (${resposta.status}).`);
  if (!semCache) cache.set(caminho, dados);
  return dados;
}

export async function enviar(caminho, corpo, metodo = 'POST') {
  const resposta = await fetch(`/api${caminho}`, { method: metodo, headers: cabecalhos(), body: JSON.stringify(corpo ?? {}) });
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(dados.erro || 'Não foi possível concluir.');
  cache.clear(); // qualquer escrita invalida o cache de leitura
  return dados;
}

// Chat: chama aoEvento('mensagem' | 'online', dados). Devolve função para cancelar.
export function assinarChat(aoEvento) {
  const fonte = new EventSource(`/api/chat/stream${token ? `?token=${encodeURIComponent(token)}` : ''}`);
  fonte.addEventListener('mensagem', (e) => aoEvento('mensagem', JSON.parse(e.data)));
  fonte.addEventListener('online', (e) => aoEvento('online', JSON.parse(e.data)));
  return () => fonte.close();
}

export const capa = (slug, tipo = 'poster', n) => `/api/capa/${slug}.svg?tipo=${tipo}${n ? `&n=${n}` : ''}`;
