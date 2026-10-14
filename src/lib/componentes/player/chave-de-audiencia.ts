// Arquivo: src/lib/componentes/player/chave-de-audiencia.ts
// Identificador anonimo por aba. Serve so pra contar espectador sem exigir conta;
// nao acompanha ninguem entre sessoes de proposito.

const CHAVE = 'yokira-chave-audiencia';

export function obterChaveDeAudiencia(): string {
  if (typeof sessionStorage === 'undefined') return 'anonimo';

  const guardada = sessionStorage.getItem(CHAVE);
  if (guardada) return guardada;

  const nova = crypto.randomUUID();
  sessionStorage.setItem(CHAVE, nova);
  return nova;
}
