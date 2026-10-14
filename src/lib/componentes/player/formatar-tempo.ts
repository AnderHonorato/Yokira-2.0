// Arquivo: src/lib/componentes/player/formatar-tempo.ts
// Tempo do player em texto. Fora do componente pra testar as bordas — NaN antes dos
// metadados chegarem, duracao infinita de transmissao ao vivo, episodio passando de
// uma hora — sem montar um <video>.

/** "8:05" ate 59:59; "1:02:03" a partir de uma hora. */
export function formatarTempo(segundos: number): string {
  if (!Number.isFinite(segundos) || segundos < 0) return '0:00';

  const total = Math.floor(segundos);
  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const restantes = total % 60;

  const doisDigitos = (valor: number) => String(valor).padStart(2, '0');

  return horas > 0
    ? `${horas}:${doisDigitos(minutos)}:${doisDigitos(restantes)}`
    : `${minutos}:${doisDigitos(restantes)}`;
}

/** Fracao 0..1 do quanto ja passou. Duracao invalida vira 0, nunca NaN na barra. */
export function fracaoAssistida(atual: number, duracao: number): number {
  if (!Number.isFinite(duracao) || duracao <= 0) return 0;
  if (!Number.isFinite(atual) || atual <= 0) return 0;
  return Math.min(1, atual / duracao);
}

/** Segundo correspondente a uma posicao 0..1 na barra. */
export function segundoNaPosicao(fracao: number, duracao: number): number {
  if (!Number.isFinite(duracao) || duracao <= 0) return 0;
  return Math.min(duracao, Math.max(0, fracao * duracao));
}
