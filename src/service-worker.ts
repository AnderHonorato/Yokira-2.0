// Arquivo: src/service-worker.ts
// Cache dos assets do build + stale-while-revalidate nas respostas do catalogo.
// O SvelteKit injeta a lista de arquivos e a versao do build, entao a limpeza de cache
// antigo acontece sozinha a cada deploy.

/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

const trabalhador = self as unknown as ServiceWorkerGlobalScope;
const CACHE_DE_ASSETS = `yokira-assets-${version}`;
const CACHE_DE_DADOS = `yokira-dados-${version}`;
const ASSETS = [...build, ...files];

trabalhador.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE_DE_ASSETS)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => trabalhador.skipWaiting())
  );
});

trabalhador.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then(async (nomes) => {
      for (const nome of nomes) {
        if (nome !== CACHE_DE_ASSETS && nome !== CACHE_DE_DADOS) await caches.delete(nome);
      }
      await trabalhador.clients.claim();
    })
  );
});

trabalhador.addEventListener('fetch', (evento) => {
  const requisicao = evento.request;
  if (requisicao.method !== 'GET') return;

  const url = new URL(requisicao.url);
  if (url.origin !== location.origin) return;

  if (ASSETS.includes(url.pathname)) {
    evento.respondWith(servirDoCache(CACHE_DE_ASSETS, requisicao));
    return;
  }

  if (url.pathname.startsWith('/api/catalogo')) {
    evento.respondWith(revalidarEmSegundoPlano(CACHE_DE_DADOS, requisicao));
  }
});

async function servirDoCache(nome: string, requisicao: Request): Promise<Response> {
  const cache = await caches.open(nome);
  const guardado = await cache.match(requisicao);
  return guardado ?? fetch(requisicao);
}

/** Pinta com o que tem e atualiza atras: e daqui que vem a sensacao de "abriu na hora". */
async function revalidarEmSegundoPlano(nome: string, requisicao: Request): Promise<Response> {
  const cache = await caches.open(nome);
  const guardado = await cache.match(requisicao);

  const rede = fetch(requisicao)
    .then((resposta) => {
      if (resposta.ok) cache.put(requisicao, resposta.clone());
      return resposta;
    })
    .catch(() => guardado ?? Response.error());

  return guardado ?? rede;
}
