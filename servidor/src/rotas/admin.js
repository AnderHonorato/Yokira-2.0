// Painel administrativo: aparência do site (fundo do destaque), uploads, animes e usuários
import { Router } from 'express';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { lerJSON, salvarJSON, pastaUploads } from '../servicos/arquivo.js';
import { banco, acharAnime, salvarBanco } from '../servicos/banco.js';
import { resumir } from '../servicos/resumo.js';
import { dados, publico, exigirAdmin, salvarUsuarios } from '../servicos/usuarios.js';
import { slugificar } from '../dados/gerar.js';

export const rotasAdmin = Router();
const PADRAO = { heroTipo: 'gradiente', heroUrl: '', heroEscurecer: 55, particulas: true, destaques: [] };
export const aparencia = lerJSON('aparencia.json', PADRAO);

rotasAdmin.get('/aparencia', (_req, res) => res.json({ ...PADRAO, ...aparencia }));

rotasAdmin.put('/admin/aparencia', exigirAdmin, (req, res) => {
  const b = req.body ?? {};
  if (b.heroTipo && ['gradiente', 'imagem', 'video'].includes(b.heroTipo)) aparencia.heroTipo = b.heroTipo;
  if (b.heroUrl !== undefined) aparencia.heroUrl = String(b.heroUrl).slice(0, 500);
  if (b.heroEscurecer !== undefined) aparencia.heroEscurecer = Math.min(90, Math.max(0, Number(b.heroEscurecer) || 0));
  if (b.particulas !== undefined) aparencia.particulas = Boolean(b.particulas);
  if (Array.isArray(b.destaques)) aparencia.destaques = b.destaques.filter(acharAnime).slice(0, 8);
  salvarJSON('aparencia.json', aparencia);
  res.json({ ...PADRAO, ...aparencia });
});

// Upload em base64 (imagem até ~8 MB, vídeo/GIF até ~12 MB pelo limite do JSON)
const TIPOS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'video/mp4': 'mp4', 'video/webm': 'webm' };
rotasAdmin.post('/admin/upload', exigirAdmin, (req, res) => {
  const m = String(req.body?.dataUrl ?? '').match(/^data:([\w/+.-]+);base64,(.+)$/);
  if (!m || !TIPOS[m[1]]) return res.status(400).json({ erro: 'Envie JPG, PNG, WEBP, GIF, MP4 ou WEBM.' });
  const nome = `${Date.now()}-${slugificar(String(req.body?.nome ?? 'arquivo')).slice(0, 30)}.${TIPOS[m[1]]}`;
  writeFileSync(join(pastaUploads, nome), Buffer.from(m[2], 'base64'));
  res.status(201).json({ url: `/uploads/${nome}`, tipo: m[1].startsWith('video') ? 'video' : 'imagem' });
});

rotasAdmin.get('/admin/resumo', exigirAdmin, (_req, res) => res.json({
  animes: banco.animes.length, noAr: banco.animes.filter((a) => a.status === 'no-ar').length,
  usuarios: dados.usuarios.length, episodios: banco.animes.reduce((s, a) => s + a.episodios.length, 0),
  atividades24h: dados.atividades.filter((a) => Date.now() - new Date(a.em) < 86400000).length,
}));

rotasAdmin.get('/admin/usuarios', exigirAdmin, (_req, res) =>
  res.json(dados.usuarios.map((u) => ({ ...publico(u), email: u.email }))));
rotasAdmin.put('/admin/usuarios/:id', exigirAdmin, (req, res) => {
  const u = dados.usuarios.find((x) => x.id === req.params.id);
  if (!u) return res.status(404).json({ erro: 'Usuário não encontrado.' });
  if (['admin', 'membro'].includes(req.body?.papel)) u.papel = req.body.papel;
  salvarUsuarios();
  res.json(publico(u));
});

rotasAdmin.get('/admin/animes', exigirAdmin, (_req, res) => res.json(banco.animes.map(resumir)));
rotasAdmin.put('/admin/animes/:slug', exigirAdmin, (req, res) => {
  const a = acharAnime(req.params.slug);
  if (!a) return res.status(404).json({ erro: 'Anime não encontrado.' });
  const b = req.body ?? {};
  for (const campo of ['titulo', 'tituloOriginal', 'sinopse', 'estudio']) if (typeof b[campo] === 'string' && b[campo].trim()) a[campo] = b[campo].trim();
  if (['no-ar', 'finalizado', 'em-breve'].includes(b.status)) a.status = b.status;
  if (Array.isArray(b.episodios)) {
    for (const ep of b.episodios) {
      const alvo = a.episodios.find((e) => e.numero === ep.numero);
      if (!alvo) continue;
      if (typeof ep.titulo === 'string') alvo.titulo = ep.titulo;
      if (typeof ep.urlVideo === 'string') alvo.urlVideo = ep.urlVideo;
      if (typeof ep.disponivel === 'boolean') alvo.disponivel = ep.disponivel;
    }
  }
  salvarBanco();
  res.json(a);
});
