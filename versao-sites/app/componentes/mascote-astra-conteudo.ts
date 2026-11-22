export const textosAstra = {
 pt: {
  nome: 'ASTRA · GUIA YOKIRA',
  titulo: 'Um guardião para sua próxima descoberta.',
  descricao: 'Um toque de energia cósmica no universo Yokira.',
  abrir: 'Conhecer o Astra',
  fechar: 'Recolher o Astra',
  saudacao: 'Prefere descobrir um novo anime ou encontrar a comunidade?',
  acervo: 'Explorar acervo',
  comunidade: 'Abrir comunidade'
 },
 en: {
  nome: 'ASTRA · YOKIRA GUIDE',
  titulo: 'A guardian for your next discovery.',
  descricao: 'A little cosmic energy for the Yokira universe.',
  abrir: 'Meet Astra',
  fechar: 'Close Astra',
  saudacao: 'Explore a new anime or visit the community?',
  acervo: 'Explore catalog',
  comunidade: 'Open community'
 },
 es: {
  nome: 'ASTRA · GUÍA YOKIRA',
  titulo: 'Un guardián para tu próximo descubrimiento.',
  descricao: 'Un toque de energía cósmica para Yokira.',
  abrir: 'Conocer a Astra',
  fechar: 'Cerrar Astra',
  saudacao: '¿Descubrir un anime nuevo o visitar la comunidad?',
  acervo: 'Explorar catálogo',
  comunidade: 'Abrir comunidad'
 }
} as const;
export function textoMascoteAstra(idioma: string) {
 return textosAstra[idioma === 'en' ? 'en' : idioma === 'es' ? 'es' : 'pt'];
}
