// Arquivo: src/lib/cliente/navegacao-instantanea.ts
// Decide a estrategia de prefetch. No toque nao existe hover: se deixar "hover" no celular,
// a rota so comeca a carregar depois do clique — que e exatamente a lentidao que queremos matar.

export type EstrategiaDePrefetch = 'hover' | 'tap';

export function estrategiaDePrefetch(): EstrategiaDePrefetch {
  if (typeof window === 'undefined') return 'hover';
  const temApontadorFino = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  return temApontadorFino ? 'hover' : 'tap';
}

export function estaOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}
