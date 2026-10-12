// Versão enxuta do anime para listas e cartões (não envia episódios/personagens)
export function resumir(anime) {
  const disponiveis = anime.episodios.filter((e) => e.disponivel).length;
  return {
    id: anime.id, slug: anime.slug, titulo: anime.titulo, formato: anime.formato, status: anime.status,
    ano: anime.ano, temporada: anime.temporada, nota: anime.nota, generos: anime.generos,
    totalEpisodios: anime.totalEpisodios, episodiosDisponiveis: disponiveis, dublado: anime.dublado,
    diaExibicao: anime.diaExibicao, horario: anime.horario, dataEstreia: anime.dataEstreia,
    estudio: anime.estudio, sinopse: anime.sinopse, tendencia: anime.tendencia, popularidade: anime.popularidade,
  };
}
