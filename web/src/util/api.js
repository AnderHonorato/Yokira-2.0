// Cliente mínimo da API com cache em memória para GETs
const cache = new Map();

export async function buscar(caminho, { semCache = false } = {}) {
  if (!semCache && cache.has(caminho)) return cache.get(caminho);
  const resposta = await fetch(`/api${caminho}`);
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(dados.erro || `Falha ao carregar (${resposta.status}).`);
  if (!semCache) cache.set(caminho, dados);
  return dados;
}

export async function enviar(caminho, corpo) {
  const resposta = await fetch(`/api${caminho}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo),
  });
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(dados.erro || 'Não foi possível enviar.');
  return dados;
}

export const capa = (slug, tipo = 'poster', n) => `/api/capa/${slug}.svg?tipo=${tipo}${n ? `&n=${n}` : ''}`;
