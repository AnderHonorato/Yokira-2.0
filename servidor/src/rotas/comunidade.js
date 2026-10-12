// Comunidade: ranking por XP, perfis, atividade ao vivo, anime da semana e fórum
import { Router } from 'express';
import { banco, acharAnime } from '../servicos/banco.js';
import { resumir } from '../servicos/resumo.js';
import { lerJSON, salvarJSON } from '../servicos/arquivo.js';
import { dados, publico, acharUsuario, exigirLogin, ganharXP, salvarUsuarios, TIERS, tierDe, XP } from '../servicos/usuarios.js';

export const rotasComunidade = Router();
const forum = lerJSON('forum.json', { topicos: [] });
const semanaAtual = () => { const d = new Date(); const ini = new Date(d.getFullYear(), 0, 1); return `${d.getFullYear()}-${Math.ceil(((d - ini) / 86400000 + ini.getDay() + 1) / 7)}`; };

rotasComunidade.get('/ranking', (_req, res) => {
  const lista = [...dados.usuarios].sort((a, b) => b.xp - a.xp).map((u, i) => ({ posicao: i + 1, ...publico(u) }));
  const distribuicao = TIERS.map((t) => ({ nome: t.nome, cor: t.cor, total: dados.usuarios.filter((u) => tierDe(u.xp).nome === t.nome).length }));
  res.json({ lista: lista.slice(0, 100), distribuicao, tiers: TIERS });
});

rotasComunidade.get('/comunidade', (_req, res) => {
  const comentarios = lerJSON('comentarios.json', {});
  const resenhas = Object.entries(comentarios).flatMap(([slug, l]) => l.map((c) => ({ ...c, slug, titulo: acharAnime(slug)?.titulo })))
    .sort((a, b) => b.data.localeCompare(a.data)).slice(0, 6);
  const atividades = dados.atividades.slice(0, 20).map((a) => ({ ...a, usuario: publico(acharUsuario(a.usuarioId)) })).filter((a) => a.usuario);
  res.json({
    topXp: [...dados.usuarios].sort((a, b) => b.xp - a.xp).slice(0, 10).map(publico),
    recentes: [...dados.usuarios].reverse().slice(0, 8).map(publico),
    resenhas, atividades, totalMembros: dados.usuarios.length,
  });
});

rotasComunidade.get('/usuarios/:id', (req, res) => {
  const u = acharUsuario(req.params.id);
  if (!u) return res.status(404).json({ erro: 'Perfil não encontrado.' });
  const fav = Object.keys(u.biblioteca.favoritos).map(acharAnime).filter(Boolean).map(resumir);
  const lista = Object.keys(u.biblioteca.lista).map(acharAnime).filter(Boolean).map(resumir);
  const assistidos = Object.values(u.biblioteca.assistidos).flat().length;
  res.json({ ...publico(u), favoritos: fav, lista, assistidos,
    atividades: dados.atividades.filter((a) => a.usuarioId === u.id).slice(0, 15) });
});

// Anime da semana: 1 voto por conta por semana entre os títulos no ar
const votos = lerJSON('votos.json', {});
rotasComunidade.get('/votacao', (req, res) => {
  const semana = semanaAtual();
  const contagem = votos[semana] ?? {};
  const total = Object.values(contagem).reduce((s, n) => s + n, 0);
  const candidatos = banco.animes.filter((a) => a.status === 'no-ar')
    .map((a) => ({ ...resumir(a), votos: contagem[a.slug] ?? 0, percentual: total ? Math.round(((contagem[a.slug] ?? 0) / total) * 100) : 0 }))
    .sort((a, b) => b.votos - a.votos || b.tendencia - a.tendencia);
  res.json({ semana, total, candidatos, meuVoto: req.usuario?.votos?.[semana] ?? null });
});
rotasComunidade.post('/votacao', exigirLogin, (req, res) => {
  const semana = semanaAtual();
  const slug = String(req.body?.slug ?? '');
  if (acharAnime(slug)?.status !== 'no-ar') return res.status(400).json({ erro: 'Escolha um anime que está no ar.' });
  if (req.usuario.votos[semana]) return res.status(409).json({ erro: 'Você já votou nesta semana.' });
  votos[semana] = { ...(votos[semana] ?? {}), [slug]: (votos[semana]?.[slug] ?? 0) + 1 };
  req.usuario.votos[semana] = slug;
  salvarJSON('votos.json', votos);
  ganharXP(req.usuario, XP.voto, 'votou no anime da semana', { slug });
  res.status(201).json({ ok: true });
});

// Fórum: tópicos com categorias, respostas e votos
const CATEGORIAS = ['Geral', 'Recomendações', 'Teorias', 'Notícias', 'Spoilers', 'Sugestões'];
const resumoTopico = (t) => ({ id: t.id, titulo: t.titulo, categoria: t.categoria, autor: publico(acharUsuario(t.autorId)),
  em: t.em, votos: t.votantes.length, respostas: t.respostas.length, fixado: Boolean(t.fixado), ultimaEm: t.respostas.at(-1)?.em ?? t.em });

rotasComunidade.get('/forum', (req, res) => {
  const { ordem = 'recentes', categoria, q } = req.query;
  let lista = forum.topicos;
  if (categoria) lista = lista.filter((t) => t.categoria === categoria);
  if (q) lista = lista.filter((t) => t.titulo.toLowerCase().includes(String(q).toLowerCase()));
  if (ordem === 'sem-resposta') lista = lista.filter((t) => !t.respostas.length);
  const ord = { recentes: (a, b) => b.ultimaEm.localeCompare(a.ultimaEm), votados: (a, b) => b.votos - a.votos,
    'em-alta': (a, b) => (b.votos + b.respostas * 2) - (a.votos + a.respostas * 2) };
  const itens = lista.map(resumoTopico).sort((a, b) => (b.fixado - a.fixado) || (ord[ordem] ?? ord.recentes)(a, b));
  res.json({ categorias: CATEGORIAS, itens });
});
rotasComunidade.get('/forum/:id', (req, res) => {
  const t = forum.topicos.find((x) => x.id === req.params.id);
  if (!t) return res.status(404).json({ erro: 'Tópico não encontrado.' });
  res.json({ ...resumoTopico(t), texto: t.texto, votantes: t.votantes,
    respostas: t.respostas.map((r) => ({ ...r, autor: publico(acharUsuario(r.autorId)) })) });
});
rotasComunidade.post('/forum', exigirLogin, (req, res) => {
  const titulo = String(req.body?.titulo ?? '').trim().slice(0, 120);
  const texto = String(req.body?.texto ?? '').trim().slice(0, 4000);
  const categoria = CATEGORIAS.includes(req.body?.categoria) ? req.body.categoria : 'Geral';
  if (titulo.length < 6 || texto.length < 10) return res.status(400).json({ erro: 'Título com 6+ caracteres e texto com 10+.' });
  const t = { id: Date.now().toString(36), titulo, texto, categoria, autorId: req.usuario.id, em: new Date().toISOString(), votantes: [], respostas: [] };
  forum.topicos.unshift(t);
  salvarJSON('forum.json', forum);
  ganharXP(req.usuario, XP.topico, 'abriu um tópico no fórum', { topicoId: t.id });
  res.status(201).json({ id: t.id });
});
rotasComunidade.post('/forum/:id/respostas', exigirLogin, (req, res) => {
  const t = forum.topicos.find((x) => x.id === req.params.id);
  const texto = String(req.body?.texto ?? '').trim().slice(0, 3000);
  if (!t) return res.status(404).json({ erro: 'Tópico não encontrado.' });
  if (texto.length < 2) return res.status(400).json({ erro: 'Escreva uma resposta.' });
  const r = { id: Date.now().toString(36), texto, autorId: req.usuario.id, em: new Date().toISOString() };
  t.respostas.push(r);
  salvarJSON('forum.json', forum);
  ganharXP(req.usuario, XP.resposta, 'respondeu no fórum', { topicoId: t.id });
  res.status(201).json({ ...r, autor: publico(req.usuario) });
});
rotasComunidade.post('/forum/:id/votar', exigirLogin, (req, res) => {
  const t = forum.topicos.find((x) => x.id === req.params.id);
  if (!t) return res.status(404).json({ erro: 'Tópico não encontrado.' });
  t.votantes = t.votantes.includes(req.usuario.id) ? t.votantes.filter((v) => v !== req.usuario.id) : [...t.votantes, req.usuario.id];
  salvarJSON('forum.json', forum);
  salvarUsuarios();
  res.json({ votos: t.votantes.length, votei: t.votantes.includes(req.usuario.id) });
});
