// Arquivo: src/lib/componentes/player/pulso-de-audiencia.ts
// Avisa o servidor, de tempos em tempos, que esta gente assistindo. Fora do componente
// pra testar o ciclo sem timer de verdade e sem montar o player.

export const INTERVALO_DO_PULSO_MS = 30_000;

export interface PulsoDeAudiencia {
  iniciar: () => void;
  encerrar: () => void;
}

export function criarPulso(
  bater: () => Promise<number | null>,
  aoContar: (assistindo: number) => void,
  intervaloMs = INTERVALO_DO_PULSO_MS
): PulsoDeAudiencia {
  let temporizador: ReturnType<typeof setInterval> | undefined;

  async function pulsar() {
    const assistindo = await bater().catch(() => null);
    // Falha de rede nao pode zerar o contador na tela: sem numero novo, fica o antigo.
    if (assistindo !== null) aoContar(assistindo);
  }

  return {
    iniciar() {
      if (temporizador) return;
      void pulsar();
      temporizador = setInterval(() => void pulsar(), intervaloMs);
    },
    encerrar() {
      clearInterval(temporizador);
      temporizador = undefined;
    }
  };
}
