// Arquivo: src/lib/componentes/player/progresso-periodico.ts
// Grava a cada 15s (e em pause/beforeunload), nunca a cada segundo: um POST por segundo
// por espectador derruba o servidor sem ganhar precisao nenhuma.

export const INTERVALO_DE_GRAVACAO_MS = 15_000;

export function deveGravar(ultimoEnvioMs: number, agoraMs: number): boolean {
  return agoraMs - ultimoEnvioMs >= INTERVALO_DE_GRAVACAO_MS;
}

export interface AgendadorDeProgresso {
  aoAtualizarTempo: (segundos: number) => void;
  gravarAgora: (segundos: number) => void;
  encerrar: () => void;
}

export function criarAgendador(
  enviar: (segundos: number) => void,
  agora: () => number = Date.now
): AgendadorDeProgresso {
  // Comeca no "agora" e nao em zero: com zero, o primeiro timeupdate ja passaria dos 15s
  // e gravaria na hora, gerando um POST em toda montagem do player.
  let ultimoEnvio = agora();
  let ultimoSegundo = 0;

  return {
    aoAtualizarTempo(segundos) {
      ultimoSegundo = Math.floor(segundos);
      if (!deveGravar(ultimoEnvio, agora())) return;
      ultimoEnvio = agora();
      enviar(ultimoSegundo);
    },
    gravarAgora(segundos) {
      ultimoEnvio = agora();
      enviar(Math.floor(segundos));
    },
    encerrar() {
      if (ultimoSegundo > 0) enviar(ultimoSegundo);
    }
  };
}
