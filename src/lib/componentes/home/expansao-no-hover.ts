// Arquivo: src/lib/componentes/home/expansao-no-hover.ts
// Atraso de 350ms antes de expandir. Sem isso o card dispara so de o mouse atravessar
// a trilha, e a home vira uma pipoca de paineis abrindo.

import { writable, type Readable } from 'svelte/store';

export const ATRASO_MS = 350;
export const LARGURA_MINIMA_PARA_EXPANDIR = 1024;

export interface ControleDeExpansao {
  expandido: Readable<boolean>;
  aoEntrar: () => void;
  aoSair: () => void;
}

function telaComporta(): boolean {
  if (typeof window === 'undefined') return false;
  // Aparelho de toque nao expande: o toque tem que abrir a pagina do titulo.
  const apontadorFino = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  return apontadorFino && window.innerWidth >= LARGURA_MINIMA_PARA_EXPANDIR;
}

export function criarControleDeExpansao(atraso = ATRASO_MS): ControleDeExpansao {
  const expandido = writable(false);
  let temporizador: ReturnType<typeof setTimeout> | undefined;

  return {
    expandido,
    aoEntrar() {
      if (!telaComporta()) return;
      clearTimeout(temporizador);
      temporizador = setTimeout(() => expandido.set(true), atraso);
    },
    aoSair() {
      clearTimeout(temporizador);
      expandido.set(false);
    }
  };
}
