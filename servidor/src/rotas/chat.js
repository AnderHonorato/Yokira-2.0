// Chat em tempo real com Server-Sent Events: salas, histórico e quem está online
import { Router } from 'express';
import { lerJSON, salvarJSON } from '../servicos/arquivo.js';
import { banco } from '../servicos/banco.js';
import { exigirLogin, publico, ganharXP, XP } from '../servicos/usuarios.js';

export const rotasChat = Router();
const historico = lerJSON('chat.json', { geral: [] });
const conexoes = new Set(); // { res, usuario }
const ultimoEnvio = new Map();

const salaValida = (sala) => sala === 'geral' || banco.animes.some((a) => a.slug === sala);
function online() {
  const vistos = new Map();
  for (const c of conexoes) if (c.usuario) vistos.set(c.usuario.id, publico(c.usuario));
  return { total: conexoes.size, usuarios: [...vistos.values()].sort((a, b) => b.xp - a.xp) };
}
function transmitir(evento, dados) {
  const linha = `event: ${evento}\ndata: ${JSON.stringify(dados)}\n\n`;
  for (const c of conexoes) c.res.write(linha);
}

rotasChat.get('/chat/salas', (_req, res) => {
  const resumo = (slug, titulo) => {
    const ultima = historico[slug]?.at(-1);
    return { slug, titulo, ultima: ultima ? { nome: ultima.autor.nome, texto: ultima.texto, em: ultima.em } : null };
  };
  const ativas = Object.keys(historico).filter((s) => s !== 'geral' && historico[s].length)
    .map((s) => resumo(s, banco.animes.find((a) => a.slug === s)?.titulo ?? s))
    .sort((a, b) => (b.ultima?.em ?? '').localeCompare(a.ultima?.em ?? ''));
  const emAlta = [...banco.animes].sort((a, b) => b.tendencia - a.tendencia).slice(0, 6)
    .filter((a) => !historico[a.slug]?.length).map((a) => resumo(a.slug, a.titulo));
  res.json({ geral: resumo('geral', 'Chat geral'), ativas, emAlta });
});

rotasChat.get('/chat/:sala/mensagens', (req, res) => {
  if (!salaValida(req.params.sala)) return res.status(404).json({ erro: 'Sala não encontrada.' });
  res.json((historico[req.params.sala] ?? []).slice(-120));
});

rotasChat.post('/chat/:sala', exigirLogin, (req, res) => {
  const { sala } = req.params;
  if (!salaValida(sala)) return res.status(404).json({ erro: 'Sala não encontrada.' });
  const texto = String(req.body?.texto ?? '').trim().slice(0, 500);
  if (!texto) return res.status(400).json({ erro: 'Mensagem vazia.' });
  if (Date.now() - (ultimoEnvio.get(req.usuario.id) ?? 0) < 1200) return res.status(429).json({ erro: 'Calma: espere um instante entre mensagens.' });
  ultimoEnvio.set(req.usuario.id, Date.now());
  const msg = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), sala, texto, em: new Date().toISOString(), autor: publico(req.usuario) };
  historico[sala] = [...(historico[sala] ?? []), msg].slice(-300);
  salvarJSON('chat.json', historico);
  ganharXP(req.usuario, XP.chat, 'mandou mensagem no chat');
  transmitir('mensagem', msg);
  res.status(201).json(msg);
});

rotasChat.get('/chat/online', (_req, res) => res.json(online()));

// Conexão contínua: GET /api/chat/stream?token=...
rotasChat.get('/chat/stream', (req, res) => {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  res.flushHeaders();
  const conexao = { res, usuario: req.usuario };
  conexoes.add(conexao);
  res.write(`event: online\ndata: ${JSON.stringify(online())}\n\n`);
  transmitir('online', online());
  const pulso = setInterval(() => res.write(': ping\n\n'), 25000);
  req.on('close', () => { clearInterval(pulso); conexoes.delete(conexao); transmitir('online', online()); });
});
