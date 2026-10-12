// Rotas que montam vitrines: início, agenda, top 100, notícias e capas
import { Router } from 'express';
import { banco } from '../servicos/banco.js';
import { resumir } from '../servicos/resumo.js';
import { gerarCapa } from '../servicos/capa.js';
import { acharAnime } from '../servicos/banco.js';

export const rotasVitrine = Router();
const ordenar = (lista, campo) => [...lista].sort((a, b) => (b[campo] ?? 0) - (a[campo] ?? 0));

rotasVitrine.get('/inicio', (_req, res) => {
  const { animes } = banco;
  const noAr = animes.filter((a) => a.status === 'no-ar');
  const emBreve = animes.filter((a) => a.status === 'em-breve').sort((a, b) => a.dataEstreia.localeCompare(b.dataEstreia));
  const encerrando = noAr.filter((a) => a.totalEpisodios - a.episodios.filter((e) => e.disponivel).length <= 2);
  res.json({
    destaques: ordenar(noAr, 'tendencia').slice(0, 5).map(resumir),
    emAlta: ordenar(animes, 'tendencia').slice(0, 10).map(resumir),
    noAr: noAr.map(resumir),
    top: ordenar(animes.filter((a) => a.nota), 'nota').slice(0, 12).map(resumir),
    emBreve: emBreve.map(resumir),
    encerrando: encerrando.map(resumir),
    noticias: banco.noticias.slice(0, 4),
    ranking: banco.ranking.slice(0, 5),
    estatisticas: {
      noAr: noAr.length,
      episodiosTemporada: noAr.reduce((s, a) => s + a.episodios.filter((e) => e.disponivel).length, 0),
      titulos: animes.length,
    },
  });
});

rotasVitrine.get('/agenda', (_req, res) => {
  const hoje = new Date();
  const dias = Array.from({ length: 7 }, (_, i) => {
    const data = new Date(hoje); data.setDate(hoje.getDate() + i);
    const itens = banco.animes
      .filter((a) => a.status === 'no-ar' && a.diaExibicao === data.getDay())
      .sort((a, b) => a.horario.localeCompare(b.horario))
      .map((a) => ({ ...resumir(a), proximoEpisodio: Math.min(a.totalEpisodios, a.episodios.filter((e) => e.disponivel).length + 1) }));
    return { data: data.toISOString().slice(0, 10), diaSemana: data.getDay(), itens };
  });
  res.json(dias);
});

const DECADAS = { '2020': [2020, 2029], '2010': [2010, 2019], '2000': [2000, 2009], antigos: [0, 1999] };
rotasVitrine.get('/top', (req, res) => {
  const faixa = DECADAS[req.query.decada];
  const lista = banco.animes.filter((a) => a.nota && (!faixa || (a.ano >= faixa[0] && a.ano <= faixa[1])));
  res.json(ordenar(lista, 'nota').slice(0, 100).map((a, i) => ({ posicao: i + 1, ...resumir(a) })));
});

rotasVitrine.get('/noticias', (_req, res) => res.json(banco.noticias));
rotasVitrine.get('/noticias/:slug', (req, res) => {
  const noticia = banco.noticias.find((n) => n.slug === req.params.slug);
  if (!noticia) return res.status(404).json({ erro: 'Notícia não encontrada.' });
  res.json(noticia);
});

rotasVitrine.get('/ranking', (_req, res) => res.json(banco.ranking));

// /api/capa/:slug.svg?tipo=poster|banner|ep&n=3
rotasVitrine.get('/capa/:arquivo', (req, res) => {
  const slug = req.params.arquivo.replace(/\.svg$/, '');
  const anime = acharAnime(slug);
  const titulo = anime?.titulo ?? (banco.noticias.find((n) => n.slug === slug)?.titulo ?? 'Yōkira');
  res.type('image/svg+xml').set('Cache-Control', 'public, max-age=86400')
    .send(gerarCapa({ slug, titulo, tipo: req.query.tipo, numero: req.query.n }));
});
