// Arquivo: src/lib/servidor/permissoes/papeis.ts
// Hierarquia de papeis em um lugar so. Comparo por peso pra nao encher o codigo de
// listas do tipo ['EDITOR','MODERADOR','ADMINISTRADOR'] repetidas em cada rota.

import { error } from '@sveltejs/kit';
import type { Papel } from '../banco/gerado/enums.js';

const PESO: Record<Papel, number> = {
  ESPECTADOR: 0,
  EDITOR: 1,
  MODERADOR: 2,
  ADMINISTRADOR: 3
};

export function temPapelMinimo(papel: Papel | undefined, minimo: Papel): boolean {
  if (!papel) return false;
  return PESO[papel] >= PESO[minimo];
}

export function exigirPapel(papel: Papel | undefined, minimo: Papel): void {
  if (!papel) throw error(401, 'Precisa entrar na conta.');
  if (!temPapelMinimo(papel, minimo)) throw error(403, 'Sua conta nao tem acesso a esta area.');
}
