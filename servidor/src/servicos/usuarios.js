// Contas, XP, tiers e feed de atividade
import { lerJSON, salvarJSON } from './arquivo.js';
import { lerToken } from './auth.js';

export const TIERS = [
  { nome: 'Novato', minimo: 0, cor: '#a1a1ac' }, { nome: 'Aprendiz', minimo: 300, cor: '#4ade80' },
  { nome: 'Veterano', minimo: 1500, cor: '#38bdf8' }, { nome: 'Elite', minimo: 5000, cor: '#8b5cf6' },
  { nome: 'Lendário', minimo: 12000, cor: '#f5c518' }, { nome: 'Mítico', minimo: 30000, cor: '#fb7185' },
];
export const XP = { cadastro: 50, episodio: 10, avaliacao: 15, chat: 2, voto: 5, topico: 20, resposta: 8 };

export const dados = lerJSON('usuarios.json', { usuarios: [], atividades: [] });
const salvar = () => salvarJSON('usuarios.json', dados);

export function tierDe(xp) {
  let atual = TIERS[0];
  for (const t of TIERS) if (xp >= t.minimo) atual = t;
  const proximo = TIERS[TIERS.indexOf(atual) + 1] ?? null;
  return { ...atual, proximo: proximo?.nome ?? null, faltam: proximo ? proximo.minimo - xp : 0,
    progresso: proximo ? (xp - atual.minimo) / (proximo.minimo - atual.minimo) : 1 };
}

// Dados que podem ir para qualquer pessoa (sem e-mail nem senha)
export const publico = (u) => u && ({ id: u.id, nome: u.nome, cor: u.cor, bio: u.bio, papel: u.papel, xp: u.xp,
  tier: tierDe(u.xp), criadoEm: u.criadoEm, avatar: u.avatar ?? null });
export const privado = (u) => u && ({ ...publico(u), email: u.email });

export const acharUsuario = (id) => dados.usuarios.find((u) => u.id === id);
export const acharPorEmail = (email) => dados.usuarios.find((u) => u.email === email.toLowerCase());

export function criarUsuario({ nome, email, hash }) {
  const cores = ['#8b5cf6', '#38bdf8', '#f472b6', '#4ade80', '#f59e0b', '#fb7185'];
  const usuario = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), nome, email: email.toLowerCase(), hash,
    papel: dados.usuarios.some((u) => !u.bot) ? 'membro' : 'admin', // a primeira conta real vira administradora
    cor: cores[dados.usuarios.length % cores.length], bio: '', xp: 0, criadoEm: new Date().toISOString(),
    biblioteca: { lista: {}, favoritos: {}, progresso: {}, assistidos: {} }, votos: {},
  };
  dados.usuarios.push(usuario);
  ganharXP(usuario, XP.cadastro, 'entrou na comunidade');
  return usuario;
}

export function ganharXP(usuario, pontos, acao, extra = {}) {
  usuario.xp += pontos;
  dados.atividades.unshift({ id: Date.now() + Math.random(), usuarioId: usuario.id, acao, pontos, em: new Date().toISOString(), ...extra });
  dados.atividades = dados.atividades.slice(0, 200);
  salvar();
}
export const salvarUsuarios = salvar;

// Middleware: lê "Authorization: Bearer <token>" e coloca req.usuario
export function autenticar(req, _res, next) {
  const token = (req.headers.authorization ?? '').replace('Bearer ', '') || req.query.token;
  req.usuario = acharUsuario(lerToken(token)) ?? null;
  next();
}
export function exigirLogin(req, res, next) {
  if (!req.usuario) return res.status(401).json({ erro: 'Entre na sua conta para continuar.' });
  next();
}
export function exigirAdmin(req, res, next) {
  if (req.usuario?.papel !== 'admin') return res.status(403).json({ erro: 'Apenas administradores.' });
  next();
}
