// Rotas de catálogo: listagem com filtros, detalhe, episódio e comentários
import { Router } from 'express';
import { banco, acharAnime, lerComentarios, salvarComentarios } from '../servicos/banco.js';
import { resumir } from '../servicos/resumo.js';
import { exigirLogin, publico, ganharXP, XP } from '../servicos/usuarios.js';
import { GENEROS, FORMATOS, TEMPORADAS, slugificar } from '../dados/gerar.js';

export const rotasCatalogo = Router();
const POR_PAGINA = 24;

const ORDENACOES = {
  popularidade: (a, b) => b.popularidade - a.popularidade,
  nota: (a, b) => (b.nota ?? 0) - (a.nota ?? 0),
  'em-alta': (a, b) => b.tendencia - a.tendencia,
  recentes: (a, b) => b.dataEstreia.localeCompare(a.dataEstreia),
  antigos: (a, b) => a.dataEstreia.localeCompare(b.dataEstreia),
  'a-z': (a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'),
};

const normalizar = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

rotasCatalogo.get('/filtros', (_req, res) => {
  const anos = [...new Set(banco.animes.map((a) => a.ano))].sort((a, b) => b - a);
  res.json({ generos: GENEROS.map((nome) => ({ nome, slug: slugificar(nome) })), anos, formatos: FORMATOS,
    temporadas: TEMPORADAS, status: ['no-ar', 'finalizado', 'em-breve'], ordens: Object.keys(ORDENACOES) });
});

rotasCatalogo.get('/animes', (req, res) => {
  const { q, genero, ano, temporada, formato, status, ordem = 'popularidade', pagina = '1', limite } = req.query;
  let lista = banco.animes;
  if (q) {
    const termo = normalizar(q);
    lista = lista.filter((a) => normalizar(a.titulo).includes(termo) || normalizar(a.tituloOriginal).includes(termo));
  }
  if (genero) lista = lista.filter((a) => a.generos.some((g) => slugificar(g) === genero));
  if (ano) lista = lista.filter((a) => String(a.ano) === String(ano));
  if (temporada) lista = lista.filter((a) => a.temporada === temporada);
  if (formato) lista = lista.filter((a) => a.formato === formato);
  if (status) lista = lista.filter((a) => a.status === status);
  lista = [...lista].sort(ORDENACOES[ordem] ?? ORDENACOES.popularidade);

  const porPagina = Math.min(Number(limite) || POR_PAGINA, 60);
  const atual = Math.max(1, Number(pagina) || 1);
  res.json({
    itens: lista.slice((atual - 1) * porPagina, atual * porPagina).map(resumir),
    total: lista.length, pagina: atual, paginas: Math.max(1, Math.ceil(lista.length / porPagina)),
  });
});

rotasCatalogo.get('/animes/:slug', (req, res) => {
  const anime = acharAnime(req.params.slug);
  if (!anime) return res.status(404).json({ erro: 'Anime não encontrado.' });
  const relacionados = banco.animes
    .filter((a) => a.slug !== anime.slug && a.generos.some((g) => anime.generos.includes(g)))
    .slice(0, 6).map(resumir);
  res.json({ ...anime, relacionados });
});

rotasCatalogo.get('/animes/:slug/episodios/:numero', (req, res) => {
  const anime = acharAnime(req.params.slug);
  const numero = Number(req.params.numero);
  const episodio = anime?.episodios.find((e) => e.numero === numero);
  if (!episodio) return res.status(404).json({ erro: 'Episódio não encontrado.' });
  if (!episodio.disponivel) return res.status(403).json({ erro: 'Este episódio ainda não foi lançado.' });
  const disponiveis = anime.episodios.filter((e) => e.disponivel);
  res.json({
    anime: { ...resumir(anime), episodios: anime.episodios.map(({ urlVideo, ...resto }) => resto) },
    episodio,
    anterior: disponiveis.find((e) => e.numero === numero - 1)?.numero ?? null,
    proximo: disponiveis.find((e) => e.numero === numero + 1)?.numero ?? null,
  });
});

rotasCatalogo.get('/animes/:slug/comentarios', (req, res) => {
  res.json(lerComentarios()[req.params.slug] ?? []);
});

rotasCatalogo.post('/animes/:slug/comentarios', exigirLogin, (req, res) => {
  if (!acharAnime(req.params.slug)) return res.status(404).json({ erro: 'Anime não encontrado.' });
  const texto = String(req.body?.texto ?? '').trim().slice(0, 1000);
  const nota = Math.min(10, Math.max(0, Number(req.body?.nota) || 0)) || null;
  if (texto.length < 3) return res.status(400).json({ erro: 'Escreva pelo menos 3 caracteres.' });
  const todos = lerComentarios();
  const novo = { id: Date.now(), usuarioId: req.usuario.id, nome: req.usuario.nome, autor: publico(req.usuario), texto, nota, curtidas: [], data: new Date().toISOString() };
  todos[req.params.slug] = [novo, ...(todos[req.params.slug] ?? [])];
  salvarComentarios(todos);
  ganharXP(req.usuario, XP.avaliacao, 'avaliou um anime', { slug: req.params.slug });
  res.status(201).json(novo);
});

rotasCatalogo.post('/animes/:slug/comentarios/:id/curtir', exigirLogin, (req, res) => {
  const todos = lerComentarios();
  const c = (todos[req.params.slug] ?? []).find((x) => String(x.id) === req.params.id);
  if (!c) return res.status(404).json({ erro: 'Avaliação não encontrada.' });
  c.curtidas = c.curtidas ?? [];
  c.curtidas = c.curtidas.includes(req.usuario.id) ? c.curtidas.filter((u) => u !== req.usuario.id) : [...c.curtidas, req.usuario.id];
  salvarComentarios(todos);
  res.json({ curtidas: c.curtidas.length, curti: c.curtidas.includes(req.usuario.id) });
});
