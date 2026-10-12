// Rótulos e formatadores usados em várias telas
export const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
export const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const ROTULO_STATUS = { 'no-ar': 'No ar', finalizado: 'Finalizado', 'em-breve': 'Em breve' };
export const ROTULO_TEMPORADA = { inverno: 'Inverno', primavera: 'Primavera', verao: 'Verão', outono: 'Outono' };
export const ROTULO_ORDEM = {
  popularidade: 'Popularidade', nota: 'Avaliação', 'em-alta': 'Em alta',
  recentes: 'Mais recentes', antigos: 'Mais antigos', 'a-z': 'A–Z',
};

export const dataCurta = (iso) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');

export function diasAte(iso) {
  const alvo = new Date(`${iso}T12:00:00`);
  return Math.max(0, Math.ceil((alvo - new Date()) / 86400000));
}

export const tempo = (segundos) => {
  const s = Math.max(0, Math.floor(segundos || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export const milhar = (n) => new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(n);
