// Arquivo: src/lib/cliente/espera-de-navegacao.ts
// Decide QUANDO o esqueleto entra. Navegacao servida pelo cache do IndexedDB resolve
// em poucos milissegundos: piscar esqueleto nela seria ruido, nao feedback. Por isso
// o esqueleto so acende quando a espera passa do limiar.
//
// Nao importa `$app/stores` de proposito: modulo virtual do SvelteKit nao resolve no
// vitest. Quem liga na navegacao de verdade e o `+layout.svelte`.

import { readable, type Readable } from 'svelte/store';

/** So o que o esqueleto precisa saber da navegacao em curso. */
export interface NavegacaoEmCurso {
  to: { url: { pathname: string } } | null;
}

export const ATRASO_DO_ESQUELETO_MS = 140;

/**
 * Devolve o caminho de destino quando a navegacao ja passou do limiar, e `null`
 * enquanto ela nao passou ou quando ja terminou.
 */
export function criarEsperaDeNavegacao(
  origem: Readable<NavegacaoEmCurso | null>,
  atrasoMs: number = ATRASO_DO_ESQUELETO_MS
): Readable<string | null> {
  return readable<string | null>(null, (definir) => {
    let temporizador: ReturnType<typeof setTimeout> | null = null;

    function cancelar() {
      if (temporizador !== null) clearTimeout(temporizador);
      temporizador = null;
    }

    const desinscrever = origem.subscribe((navegacao) => {
      // Cada mudanca reinicia a contagem: navegacao encadeada nao herda o relogio
      // da anterior, senao o esqueleto entraria cedo demais na segunda.
      cancelar();
      const destino = navegacao?.to?.url.pathname ?? null;

      if (destino === null) {
        definir(null);
        return;
      }

      temporizador = setTimeout(() => definir(destino), atrasoMs);
    });

    return () => {
      cancelar();
      desinscrever();
    };
  });
}
