// Arquivo: src/lib/cliente/registrar-service-worker.ts
// Registro isolado pra o layout nao precisar saber de nada disso.
// Em dev o SW so atrapalha (cache velho por cima do HMR), entao fica de fora.

import { dev } from '$app/environment';

export async function registrarServiceWorker(): Promise<void> {
  if (dev) return;
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

  try {
    await navigator.serviceWorker.register('/service-worker.js', { type: 'module' });
  } catch {
    // Sem service worker o app continua funcionando, so perde o modo offline.
  }
}

export async function limparCachesDoNavegador(): Promise<void> {
  if (typeof caches === 'undefined') return;
  const nomes = await caches.keys();
  await Promise.all(nomes.map((nome) => caches.delete(nome)));
}
