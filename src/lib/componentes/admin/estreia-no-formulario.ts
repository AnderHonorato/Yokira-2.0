// Arquivo: src/lib/componentes/admin/estreia-no-formulario.ts
// Conversao entre a data que vem do banco e o valor que o <input type="datetime-local">
// aceita. Fora do .svelte pra dar pra testar o fuso sem montar componente: e aqui que
// um Date.toISOString() cru deslocaria a estreia em horas sem ninguem perceber.

function doisDigitos(valor: number): string {
  return String(valor).padStart(2, '0');
}

/**
 * Valor do campo: "YYYY-MM-DDTHH:mm" em HORA LOCAL. O toISOString() daria UTC, e
 * quem agendou pras 20h veria 23h no campo — ou o dia anterior, a oeste.
 */
export function paraCampoLocal(data: Date): string {
  const dia = `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`;
  return `${dia}T${doisDigitos(data.getHours())}:${doisDigitos(data.getMinutes())}`;
}

/** Verdadeiro enquanto a estreia nao chegou. */
export function agendado(publicadoEm: Date, agora: Date = new Date()): boolean {
  return publicadoEm.getTime() > agora.getTime();
}

/** Rotulo curto do chip no painel. */
export function rotuloDeEstreia(publicadoEm: Date): string {
  return publicadoEm.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
