// Arquivo: src/lib/componentes/home/banner-destaque.ts
// Rotacao do hero. Fora do componente pra testar o ciclo sem depender de timer real na tela.

export const INTERVALO_MS = 7000;

export function proximoIndice(atual: number, total: number): number {
  if (total <= 0) return 0;
  return (atual + 1) % total;
}

export interface Rotacao {
  iniciar: () => void;
  parar: () => void;
}

export function criarRotacao(aoTrocar: () => void, intervalo = INTERVALO_MS): Rotacao {
  let temporizador: ReturnType<typeof setInterval> | undefined;

  return {
    iniciar() {
      if (temporizador) return;
      temporizador = setInterval(aoTrocar, intervalo);
    },
    parar() {
      if (!temporizador) return;
      clearInterval(temporizador);
      temporizador = undefined;
    }
  };
}
