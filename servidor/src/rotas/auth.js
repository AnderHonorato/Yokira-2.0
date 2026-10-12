// Cadastro, login, perfil e biblioteca sincronizada
import { Router } from 'express';
import { gerarHash, conferirSenha, criarToken } from '../servicos/auth.js';
import { acharPorEmail, criarUsuario, privado, exigirLogin, salvarUsuarios } from '../servicos/usuarios.js';

export const rotasAuth = Router();
const emailValido = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);

rotasAuth.post('/auth/cadastro', (req, res) => {
  const nome = String(req.body?.nome ?? '').trim();
  const email = String(req.body?.email ?? '').trim();
  const senha = String(req.body?.senha ?? '');
  if (nome.length < 3 || nome.length > 24) return res.status(400).json({ erro: 'O nome precisa ter de 3 a 24 caracteres.' });
  if (!emailValido(email)) return res.status(400).json({ erro: 'Digite um e-mail válido.' });
  if (senha.length < 6) return res.status(400).json({ erro: 'A senha precisa ter pelo menos 6 caracteres.' });
  if (acharPorEmail(email)) return res.status(409).json({ erro: 'Este e-mail já tem conta. Use "Entrar".' });
  const usuario = criarUsuario({ nome, email, hash: gerarHash(senha) });
  res.status(201).json({ token: criarToken(usuario.id), usuario: privado(usuario) });
});

rotasAuth.post('/auth/entrar', (req, res) => {
  const usuario = acharPorEmail(String(req.body?.email ?? '').trim());
  if (!usuario || !conferirSenha(String(req.body?.senha ?? ''), usuario.hash)) {
    return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
  }
  res.json({ token: criarToken(usuario.id), usuario: privado(usuario) });
});

rotasAuth.get('/auth/eu', exigirLogin, (req, res) => res.json(privado(req.usuario)));

rotasAuth.put('/auth/perfil', exigirLogin, (req, res) => {
  const { nome, bio, cor } = req.body ?? {};
  if (nome !== undefined) {
    const limpo = String(nome).trim();
    if (limpo.length < 3 || limpo.length > 24) return res.status(400).json({ erro: 'O nome precisa ter de 3 a 24 caracteres.' });
    req.usuario.nome = limpo;
  }
  if (bio !== undefined) req.usuario.bio = String(bio).slice(0, 160);
  if (cor && /^#[0-9a-f]{6}$/i.test(cor)) req.usuario.cor = cor;
  salvarUsuarios();
  res.json(privado(req.usuario));
});

rotasAuth.get('/biblioteca', exigirLogin, (req, res) => res.json(req.usuario.biblioteca));
rotasAuth.put('/biblioteca', exigirLogin, (req, res) => {
  const b = req.body ?? {};
  const campos = ['lista', 'favoritos', 'progresso', 'assistidos'];
  if (!campos.every((c) => typeof b[c] === 'object' && b[c] !== null)) return res.status(400).json({ erro: 'Biblioteca inválida.' });
  // Episódios novos marcados como assistidos rendem XP
  const antes = Object.values(req.usuario.biblioteca.assistidos ?? {}).flat().length;
  req.usuario.biblioteca = Object.fromEntries(campos.map((c) => [c, b[c]]));
  const depois = Object.values(b.assistidos).flat().length;
  if (depois > antes) req.usuario.xp += (depois - antes) * 10;
  salvarUsuarios();
  res.json({ ok: true, xp: req.usuario.xp });
});
