// Arquivo: src/lib/componentes/player/ocultar-controles.ts
// Some com a barra depois de um tempo parado, e so enquanto o video toca. Pausado a
// barra fica: quem pausou provavelmente pausou pra mexer em alguma coisa.

export const ESPERA_PARA_OCULTAR_MS = 2500;

export interface Ocultador {
  /** Mostra a barra e reinicia a contagem pra sumir. */
  revelar: () => void;
  /** Enquanto travado a barra nao some (pausado, menu aberto, foco no teclado). */
  travar: (travado: boolean) => void;
  encerrar: () => void;
}

export function criarOcultador(
  aoMudar: (visivel: boolean) => void,
  esperaMs = ESPERA_PARA_OCULTAR_MS
): Ocultador {
  let temporizador: ReturnType<typeof setTimeout> | undefined;
  let travado = true;

  function limpar() {
    if (temporizador !== undefined) clearTimeout(temporizador);
    temporizador = undefined;
  }

  function agendar() {
    limpar();
    if (travado) return;
    temporizador = setTimeout(() => aoMudar(false), esperaMs);
  }

  return {
    revelar() {
      aoMudar(true);
      agendar();
    },
    travar(valor: boolean) {
      travado = valor;
      if (travado) {
        limpar();
        aoMudar(true);
        return;
      }
      agendar();
    },
    encerrar: limpar
  };
}
