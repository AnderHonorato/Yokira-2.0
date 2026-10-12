// Modo demonstração: substitui a API real por dados locais (localStorage), para publicar o visual
// como página estática. Mesmas rotas e formatos do servidor. Não use em produção.
import bancoOriginal from '../../servidor/src/dados/banco.json';
import { gerarCapa } from '../../servidor/src/servicos/capa.js';
import { resumir } from '../../servidor/src/servicos/resumo.js';
import videoDemo from './video-demo.webm';

const ler = (k, padrao) => { try { return JSON.parse(localStorage.getItem(`yokira-demo:${k}`)) ?? padrao; } catch { return padrao; } };
const gravar = (k, v) => { try { localStorage.setItem(`yokira-demo:${k}`, JSON.stringify(v)); } catch { /* cheio */ } };
const id = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const agora = () => new Date().toISOString();

// Catálogo (com as edições feitas no painel admin)
const banco = structuredClone(bancoOriginal);
const edicoes = ler('edicoes', {});
for (const a of banco.animes) {
  for (const ep of a.episodios) ep.urlVideo = videoDemo;
  if (edicoes[a.slug]) Object.assign(a, edicoes[a.slug]);
}
const acharAnime = (slug) => banco.animes.find((a) => a.slug === slug);
const slugificar = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const normalizar = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const ordenar = (l, c) => [...l].sort((a, b) => (b[c] ?? 0) - (a[c] ?? 0));
const ORDENS = {
  popularidade: (a, b) => b.popularidade - a.popularidade, nota: (a, b) => (b.nota ?? 0) - (a.nota ?? 0),
  'em-alta': (a, b) => b.tendencia - a.tendencia, recentes: (a, b) => b.dataEstreia.localeCompare(a.dataEstreia),
  antigos: (a, b) => a.dataEstreia.localeCompare(b.dataEstreia), 'a-z': (a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'),
};

// Contas, XP e tiers
const TIERS = [
  { nome: 'Novato', minimo: 0, cor: '#a1a1ac' }, { nome: 'Aprendiz', minimo: 300, cor: '#4ade80' },
  { nome: 'Veterano', minimo: 1500, cor: '#38bdf8' }, { nome: 'Elite', minimo: 5000, cor: '#8b5cf6' },
  { nome: 'Lendário', minimo: 12000, cor: '#f5c518' }, { nome: 'Mítico', minimo: 30000, cor: '#fb7185' },
];
function tierDe(xp) {
  let atual = TIERS[0];
  for (const t of TIERS) if (xp >= t.minimo) atual = t;
  const proximo = TIERS[TIERS.indexOf(atual) + 1] ?? null;
  return { ...atual, proximo: proximo?.nome ?? null, faltam: proximo ? proximo.minimo - xp : 0, progresso: proximo ? (xp - atual.minimo) / (proximo.minimo - atual.minimo) : 1 };
}
const CORES = ['#8b5cf6', '#38bdf8', '#f472b6', '#4ade80', '#f59e0b', '#fb7185'];
const SEMENTE = [['Kitsune_br', 41200], ['mestreDoSofá', 28800], ['luaDeFerrugem', 16300], ['akari.dev', 9100], ['noturna77', 5600],
  ['pipocaOtaku', 3400], ['raposaCinza', 1900], ['setsuna', 820], ['tio_do_anime', 410], ['nanami.s', 90]];

function estadoInicial() {
  const t0 = Date.now();
  const usuarios = SEMENTE.map(([nome, xp], i) => ({ id: `bot${i}`, bot: true, nome, email: `${i}@exemplo.invalid`, senha: id(), papel: 'membro', cor: CORES[i % 6],
    bio: 'Membro de exemplo da comunidade.', xp, criadoEm: new Date(t0 - i * 864e5 * 9).toISOString(), biblioteca: { lista: {}, favoritos: {}, progresso: {}, assistidos: {} }, votos: {} }));
  const acoes = ['avaliou um anime', 'mandou mensagem no chat', 'abriu um tópico no fórum', 'votou no anime da semana', 'terminou um episódio'];
  const fala = (u, texto, min) => ({ id: id(), sala: 'geral', texto, em: new Date(t0 - min * 60000).toISOString(), autor: { id: `bot${u}`, nome: SEMENTE[u][0], cor: CORES[u % 6], xp: SEMENTE[u][1], papel: 'membro' } });
  const topico = (n, titulo, texto, categoria, autor, horas, fixado, respostas = []) => ({ id: `t${n}`, titulo, texto, categoria, autorId: `bot${autor}`,
    em: new Date(t0 - horas * 36e5).toISOString(), votantes: ['bot1', 'bot2', 'bot3'].slice(0, horas % 4), fixado,
    respostas: respostas.map(([a, txt], j) => ({ id: id(), autorId: `bot${a}`, texto: txt, em: new Date(t0 - (horas - j - 1) * 36e5).toISOString() })) });
  return {
    usuarios,
    atividades: Array.from({ length: 14 }, (_, i) => ({ id: i, usuarioId: `bot${i % 8}`, acao: acoes[i % 5], pontos: 10, em: new Date(t0 - i * 37 * 60000).toISOString() })),
    chat: { geral: [fala(1, 'bom dia, pessoal', 45), fala(4, 'alguém já viu o episódio novo de Ruído Branco?', 36), fala(2, 'vi! o final foi demais', 27),
      fala(6, 'sem spoiler aqui no geral hein 😅', 18), fala(0, 'bem-vindos a quem chegou agora', 9)] },
    forum: [
      topico(0, 'Boas-vindas: leia antes de postar', 'Respeite todo mundo, marque spoilers na categoria certa e divirta-se.', 'Geral', 0, 200, true),
      topico(1, 'Qual anime da temporada te pegou de surpresa?', 'Comecei sem expectativa e agora não perco um episódio. E vocês?', 'Recomendações', 3, 6, false,
        [[1, 'Ruído Branco, sem dúvida.'], [5, 'Expresso Sakura está muito bom.']]),
      topico(2, 'Teoria: o farol é o mesmo nos dois animes?', 'Reparei em detalhes parecidos entre Cidade dos Faróis Apagados e Vozes do Farol Norte.', 'Teorias', 2, 20, false, [[0, 'Faz sentido, mesmo estúdio!']]),
      topico(3, 'Sugestão: sala de chat para cada temporada', 'Seria legal ter salas fixas por temporada além das salas por anime.', 'Sugestões', 4, 48, false),
    ],
    comentarios: {}, votos: {}, aparencia: { heroTipo: 'gradiente', heroUrl: '', heroEscurecer: 55, particulas: true, destaques: [] },
  };
}
const estado = ler('estado', null) ?? estadoInicial();
const salvar = () => gravar('estado', estado);
salvar();

let sessaoId = ler('sessao', null);
const eu = () => estado.usuarios.find((u) => u.id === sessaoId) ?? null;
const publico = (u) => u && ({ id: u.id, nome: u.nome, cor: u.cor, bio: u.bio, papel: u.papel, xp: u.xp, tier: tierDe(u.xp), criadoEm: u.criadoEm, avatar: null });
const privado = (u) => u && ({ ...publico(u), email: u.email });
const acharUsuario = (uid) => estado.usuarios.find((u) => u.id === uid);
function ganharXP(u, pontos, acao) {
  u.xp += pontos;
  estado.atividades.unshift({ id: id(), usuarioId: u.id, acao, pontos, em: agora() });
  estado.atividades = estado.atividades.slice(0, 200);
  salvar();
}
const exigir = () => { const u = eu(); if (!u) throw new Error('Entre na sua conta para continuar.'); return u; };
const exigirAdmin = () => { const u = exigir(); if (u.papel !== 'admin') throw new Error('Apenas administradores.'); return u; };
const semana = () => { const d = new Date(); const ini = new Date(d.getFullYear(), 0, 1); return `${d.getFullYear()}-${Math.ceil(((d - ini) / 864e5 + ini.getDay() + 1) / 7)}`; };

// Chat simulado: membros de exemplo respondem de vez em quando
const ouvintes = new Set();
const emitir = (tipo, dados) => ouvintes.forEach((f) => f(tipo, dados));
function online() {
  const lista = estado.usuarios.filter((u) => u.bot).slice(0, 6).map(publico);
  const meu = eu();
  if (meu) lista.unshift(publico(meu));
  return { total: lista.length + 17, usuarios: lista.sort((a, b) => b.xp - a.xp) };
}
const RESPOSTAS = ['kkkk verdade', 'concordo total', 'alguém recomenda algo parecido?', 'esse episódio novo foi bom demais', 'bem-vindo(a)!',
  'ainda não vi, sem spoiler pfv 🙏', 'a trilha sonora desse é absurda'];
function botFala(sala) {
  const u = estado.usuarios[Math.floor(Math.random() * 7)];
  const msg = { id: id(), sala, texto: RESPOSTAS[Math.floor(Math.random() * RESPOSTAS.length)], em: agora(), autor: publico(u) };
  estado.chat[sala] = [...(estado.chat[sala] ?? []), msg].slice(-300);
  salvar();
  emitir('mensagem', msg);
}
setInterval(() => ouvintes.size && Math.random() < 0.35 && botFala('geral'), 15000);

export function assinarChat(aoEvento) {
  ouvintes.add(aoEvento);
  setTimeout(() => aoEvento('online', online()), 50);
  return () => ouvintes.delete(aoEvento);
}

const resumoTopico = (t) => ({ id: t.id, titulo: t.titulo, categoria: t.categoria, autor: publico(acharUsuario(t.autorId)), em: t.em,
  votos: t.votantes.length, respostas: t.respostas.length, fixado: Boolean(t.fixado), ultimaEm: t.respostas.at(-1)?.em ?? t.em });
const CATEGORIAS = ['Geral', 'Recomendações', 'Teorias', 'Notícias', 'Spoilers', 'Sugestões'];
const GENEROS = [...new Set(banco.animes.flatMap((a) => a.generos))].sort((a, b) => a.localeCompare(b, 'pt-BR'));

const GET = [
  [/^\/inicio$/, () => {
    const noAr = banco.animes.filter((a) => a.status === 'no-ar');
    return {
      destaques: ordenar(noAr, 'tendencia').slice(0, 5).map(resumir), emAlta: ordenar(banco.animes, 'tendencia').slice(0, 10).map(resumir),
      noAr: noAr.map(resumir), top: ordenar(banco.animes.filter((a) => a.nota), 'nota').slice(0, 12).map(resumir),
      emBreve: banco.animes.filter((a) => a.status === 'em-breve').sort((a, b) => a.dataEstreia.localeCompare(b.dataEstreia)).map(resumir),
      encerrando: noAr.filter((a) => a.totalEpisodios - a.episodios.filter((e) => e.disponivel).length <= 2).map(resumir),
      noticias: banco.noticias.slice(0, 4),
      ranking: ordenar(estado.usuarios, 'xp').slice(0, 5).map((u, i) => ({ posicao: i + 1, ...publico(u) })),
      estatisticas: { noAr: noAr.length, episodiosTemporada: noAr.reduce((s, a) => s + a.episodios.filter((e) => e.disponivel).length, 0), titulos: banco.animes.length },
    };
  }],
  [/^\/aparencia$/, () => estado.aparencia],
  [/^\/filtros$/, () => ({ generos: GENEROS.map((nome) => ({ nome, slug: slugificar(nome) })), anos: [...new Set(banco.animes.map((a) => a.ano))].sort((a, b) => b - a),
    formatos: ['TV', 'Filme', 'OVA', 'ONA', 'Especial'], temporadas: ['inverno', 'primavera', 'verao', 'outono'], status: ['no-ar', 'finalizado', 'em-breve'], ordens: Object.keys(ORDENS) })],
  [/^\/animes$/, (_m, q) => {
    let l = banco.animes;
    if (q.get('q')) l = l.filter((a) => normalizar(a.titulo).includes(normalizar(q.get('q'))) || normalizar(a.tituloOriginal).includes(normalizar(q.get('q'))));
    if (q.get('genero')) l = l.filter((a) => a.generos.some((g) => slugificar(g) === q.get('genero')));
    for (const c of ['ano', 'temporada', 'formato', 'status']) if (q.get(c)) l = l.filter((a) => String(a[c]) === q.get(c));
    l = [...l].sort(ORDENS[q.get('ordem')] ?? ORDENS.popularidade);
    const por = Math.min(Number(q.get('limite')) || 24, 60), pag = Math.max(1, Number(q.get('pagina')) || 1);
    return { itens: l.slice((pag - 1) * por, pag * por).map(resumir), total: l.length, pagina: pag, paginas: Math.max(1, Math.ceil(l.length / por)) };
  }],
  [/^\/animes\/([^/]+)\/episodios\/(\d+)$/, ([, slug, n]) => {
    const anime = acharAnime(slug), numero = Number(n), episodio = anime?.episodios.find((e) => e.numero === numero);
    if (!episodio) throw new Error('Episódio não encontrado.');
    if (!episodio.disponivel) throw new Error('Este episódio ainda não foi lançado.');
    const disp = anime.episodios.filter((e) => e.disponivel);
    return { anime: { ...resumir(anime), episodios: anime.episodios }, episodio,
      anterior: disp.find((e) => e.numero === numero - 1)?.numero ?? null, proximo: disp.find((e) => e.numero === numero + 1)?.numero ?? null };
  }],
  [/^\/animes\/([^/]+)\/comentarios$/, ([, slug]) => estado.comentarios[slug] ?? []],
  [/^\/animes\/([^/]+)$/, ([, slug]) => {
    const anime = acharAnime(slug);
    if (!anime) throw new Error('Anime não encontrado.');
    return { ...anime, relacionados: banco.animes.filter((a) => a.slug !== slug && a.generos.some((g) => anime.generos.includes(g))).slice(0, 6).map(resumir) };
  }],
  [/^\/agenda$/, () => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    return { data: d.toISOString().slice(0, 10), diaSemana: d.getDay(), itens: banco.animes.filter((a) => a.status === 'no-ar' && a.diaExibicao === d.getDay())
      .sort((a, b) => a.horario.localeCompare(b.horario)).map((a) => ({ ...resumir(a), proximoEpisodio: Math.min(a.totalEpisodios, a.episodios.filter((e) => e.disponivel).length + 1) })) };
  })],
  [/^\/top$/, (_m, q) => {
    const f = { 2020: [2020, 2029], 2010: [2010, 2019], 2000: [2000, 2009], antigos: [0, 1999] }[q.get('decada')];
    return ordenar(banco.animes.filter((a) => a.nota && (!f || (a.ano >= f[0] && a.ano <= f[1]))), 'nota').slice(0, 100).map((a, i) => ({ posicao: i + 1, ...resumir(a) }));
  }],
  [/^\/noticias$/, () => banco.noticias],
  [/^\/noticias\/([^/]+)$/, ([, slug]) => { const n = banco.noticias.find((x) => x.slug === slug); if (!n) throw new Error('Notícia não encontrada.'); return n; }],
  [/^\/auth\/eu$/, () => privado(exigir())],
  [/^\/biblioteca$/, () => exigir().biblioteca],
  [/^\/chat\/salas$/, () => {
    const resumo = (slug, titulo) => { const u = estado.chat[slug]?.at(-1); return { slug, titulo, ultima: u ? { nome: u.autor.nome, texto: u.texto, em: u.em } : null }; };
    const ativas = Object.keys(estado.chat).filter((s) => s !== 'geral' && estado.chat[s].length).map((s) => resumo(s, acharAnime(s)?.titulo ?? s));
    const emAlta = ordenar(banco.animes, 'tendencia').slice(0, 6).filter((a) => !estado.chat[a.slug]?.length).map((a) => resumo(a.slug, a.titulo));
    return { geral: resumo('geral', 'Chat geral'), ativas, emAlta };
  }],
  [/^\/chat\/([^/]+)\/mensagens$/, ([, sala]) => (estado.chat[sala] ?? []).slice(-120)],
  [/^\/ranking$/, () => ({
    lista: ordenar(estado.usuarios, 'xp').slice(0, 100).map((u, i) => ({ posicao: i + 1, ...publico(u) })),
    distribuicao: TIERS.map((t) => ({ nome: t.nome, cor: t.cor, total: estado.usuarios.filter((u) => tierDe(u.xp).nome === t.nome).length })), tiers: TIERS,
  })],
  [/^\/comunidade$/, () => ({
    topXp: ordenar(estado.usuarios, 'xp').slice(0, 10).map(publico), recentes: [...estado.usuarios].reverse().slice(0, 8).map(publico),
    resenhas: Object.entries(estado.comentarios).flatMap(([slug, l]) => l.map((c) => ({ ...c, slug, titulo: acharAnime(slug)?.titulo })))
      .sort((a, b) => b.data.localeCompare(a.data)).slice(0, 6),
    atividades: estado.atividades.slice(0, 20).map((a) => ({ ...a, usuario: publico(acharUsuario(a.usuarioId)) })).filter((a) => a.usuario),
    totalMembros: estado.usuarios.length,
  })],
  [/^\/usuarios\/([^/]+)$/, ([, uid]) => {
    const u = acharUsuario(uid);
    if (!u) throw new Error('Perfil não encontrado.');
    const animes = (o) => Object.keys(o).map(acharAnime).filter(Boolean).map(resumir);
    return { ...publico(u), favoritos: animes(u.biblioteca.favoritos), lista: animes(u.biblioteca.lista),
      assistidos: Object.values(u.biblioteca.assistidos).flat().length, atividades: estado.atividades.filter((a) => a.usuarioId === u.id).slice(0, 15) };
  }],
  [/^\/votacao$/, () => {
    const s = semana(), c = estado.votos[s] ?? {}, total = Object.values(c).reduce((x, n) => x + n, 0);
    const candidatos = banco.animes.filter((a) => a.status === 'no-ar')
      .map((a) => ({ ...resumir(a), votos: c[a.slug] ?? 0, percentual: total ? Math.round(((c[a.slug] ?? 0) / total) * 100) : 0 }))
      .sort((a, b) => b.votos - a.votos || b.tendencia - a.tendencia);
    return { semana: s, total, candidatos, meuVoto: eu()?.votos?.[s] ?? null };
  }],
  [/^\/forum$/, (_m, q) => {
    let l = estado.forum;
    if (q.get('categoria')) l = l.filter((t) => t.categoria === q.get('categoria'));
    if (q.get('q')) l = l.filter((t) => normalizar(t.titulo).includes(normalizar(q.get('q'))));
    if (q.get('ordem') === 'sem-resposta') l = l.filter((t) => !t.respostas.length);
    const ord = { recentes: (a, b) => b.ultimaEm.localeCompare(a.ultimaEm), votados: (a, b) => b.votos - a.votos,
      'em-alta': (a, b) => (b.votos + b.respostas * 2) - (a.votos + a.respostas * 2) };
    return { categorias: CATEGORIAS, itens: l.map(resumoTopico).sort((a, b) => (b.fixado - a.fixado) || (ord[q.get('ordem')] ?? ord.recentes)(a, b)) };
  }],
  [/^\/forum\/([^/]+)$/, ([, tid]) => {
    const t = estado.forum.find((x) => x.id === tid);
    if (!t) throw new Error('Tópico não encontrado.');
    return { ...resumoTopico(t), texto: t.texto, votantes: t.votantes, respostas: t.respostas.map((r) => ({ ...r, autor: publico(acharUsuario(r.autorId)) })) };
  }],
  [/^\/admin\/resumo$/, () => {
    exigirAdmin();
    return { animes: banco.animes.length, noAr: banco.animes.filter((a) => a.status === 'no-ar').length, usuarios: estado.usuarios.length,
      episodios: banco.animes.reduce((s, a) => s + a.episodios.length, 0), atividades24h: estado.atividades.filter((a) => Date.now() - new Date(a.em) < 864e5).length };
  }],
  [/^\/admin\/usuarios$/, () => { exigirAdmin(); return estado.usuarios.map(privado); }],
  [/^\/admin\/animes$/, () => { exigirAdmin(); return banco.animes.map(resumir); }],
];

const POST = [
  [/^\/auth\/cadastro$/, (_m, b) => {
    const nome = String(b.nome ?? '').trim(), email = String(b.email ?? '').trim().toLowerCase(), senha = String(b.senha ?? '');
    if (nome.length < 3 || nome.length > 24) throw new Error('O nome precisa ter de 3 a 24 caracteres.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new Error('Digite um e-mail válido.');
    if (senha.length < 6) throw new Error('A senha precisa ter pelo menos 6 caracteres.');
    if (estado.usuarios.some((u) => u.email === email)) throw new Error('Este e-mail já tem conta. Use "Entrar".');
    const u = { id: id(), nome, email, senha, papel: estado.usuarios.some((x) => !x.bot) ? 'membro' : 'admin', cor: CORES[estado.usuarios.length % 6], bio: '',
      xp: 0, criadoEm: agora(), biblioteca: { lista: {}, favoritos: {}, progresso: {}, assistidos: {} }, votos: {} };
    estado.usuarios.push(u);
    ganharXP(u, 50, 'entrou na comunidade');
    sessaoId = u.id; gravar('sessao', u.id);
    return { token: `demo-${u.id}`, usuario: privado(u) };
  }],
  [/^\/auth\/entrar$/, (_m, b) => {
    const u = estado.usuarios.find((x) => x.email === String(b.email ?? '').trim().toLowerCase());
    if (!u || u.senha !== b.senha) throw new Error('E-mail ou senha incorretos.');
    sessaoId = u.id; gravar('sessao', u.id);
    return { token: `demo-${u.id}`, usuario: privado(u) };
  }],
  [/^\/chat\/([^/]+)$/, ([, sala], b) => {
    const u = exigir();
    const texto = String(b.texto ?? '').trim().slice(0, 500);
    if (!texto) throw new Error('Mensagem vazia.');
    const msg = { id: id(), sala, texto, em: agora(), autor: publico(u) };
    estado.chat[sala] = [...(estado.chat[sala] ?? []), msg].slice(-300);
    ganharXP(u, 2, 'mandou mensagem no chat');
    emitir('mensagem', msg);
    if (Math.random() < 0.6) setTimeout(() => botFala(sala), 2500 + Math.random() * 3000);
    return msg;
  }],
  [/^\/animes\/([^/]+)\/comentarios\/([^/]+)\/curtir$/, ([, slug, cid]) => {
    const u = exigir();
    const c = (estado.comentarios[slug] ?? []).find((x) => String(x.id) === cid);
    if (!c) throw new Error('Avaliação não encontrada.');
    c.curtidas = c.curtidas.includes(u.id) ? c.curtidas.filter((x) => x !== u.id) : [...c.curtidas, u.id];
    salvar();
    return { curtidas: c.curtidas.length, curti: c.curtidas.includes(u.id) };
  }],
  [/^\/animes\/([^/]+)\/comentarios$/, ([, slug], b) => {
    const u = exigir();
    const texto = String(b.texto ?? '').trim();
    if (texto.length < 3) throw new Error('Escreva pelo menos 3 caracteres.');
    const novo = { id: id(), usuarioId: u.id, nome: u.nome, autor: publico(u), texto, nota: b.nota || null, curtidas: [], data: agora() };
    estado.comentarios[slug] = [novo, ...(estado.comentarios[slug] ?? [])];
    ganharXP(u, 15, 'avaliou um anime');
    return novo;
  }],
  [/^\/votacao$/, (_m, b) => {
    const u = exigir(), s = semana();
    if (acharAnime(b.slug)?.status !== 'no-ar') throw new Error('Escolha um anime que está no ar.');
    if (u.votos[s]) throw new Error('Você já votou nesta semana.');
    estado.votos[s] = { ...(estado.votos[s] ?? {}), [b.slug]: (estado.votos[s]?.[b.slug] ?? 0) + 1 };
    u.votos[s] = b.slug;
    ganharXP(u, 5, 'votou no anime da semana');
    return { ok: true };
  }],
  [/^\/forum$/, (_m, b) => {
    const u = exigir();
    const titulo = String(b.titulo ?? '').trim(), texto = String(b.texto ?? '').trim();
    if (titulo.length < 6 || texto.length < 10) throw new Error('Título com 6+ caracteres e texto com 10+.');
    const t = { id: id(), titulo, texto, categoria: CATEGORIAS.includes(b.categoria) ? b.categoria : 'Geral', autorId: u.id, em: agora(), votantes: [], respostas: [] };
    estado.forum.unshift(t);
    ganharXP(u, 20, 'abriu um tópico no fórum');
    return { id: t.id };
  }],
  [/^\/forum\/([^/]+)\/respostas$/, ([, tid], b) => {
    const u = exigir(), t = estado.forum.find((x) => x.id === tid);
    if (String(b.texto ?? '').trim().length < 2) throw new Error('Escreva uma resposta.');
    const r = { id: id(), texto: String(b.texto).trim(), autorId: u.id, em: agora() };
    t.respostas.push(r);
    ganharXP(u, 8, 'respondeu no fórum');
    return { ...r, autor: publico(u) };
  }],
  [/^\/forum\/([^/]+)\/votar$/, ([, tid]) => {
    const u = exigir(), t = estado.forum.find((x) => x.id === tid);
    t.votantes = t.votantes.includes(u.id) ? t.votantes.filter((v) => v !== u.id) : [...t.votantes, u.id];
    salvar();
    return { votos: t.votantes.length, votei: t.votantes.includes(u.id) };
  }],
  [/^\/admin\/upload$/, (_m, b) => {
    exigirAdmin();
    if (!/^data:(image|video)\//.test(b.dataUrl ?? '')) throw new Error('Envie uma imagem ou vídeo.');
    if (b.dataUrl.length > 4.5e6) throw new Error('Na demonstração o limite é de ~3 MB (o servidor real aceita até 12 MB). Use uma URL.');
    return { url: b.dataUrl, tipo: b.dataUrl.startsWith('data:video') ? 'video' : 'imagem' };
  }],
];

const PUT = [
  [/^\/auth\/perfil$/, (_m, b) => {
    const u = exigir();
    if (b.nome !== undefined) { const n = String(b.nome).trim(); if (n.length < 3 || n.length > 24) throw new Error('O nome precisa ter de 3 a 24 caracteres.'); u.nome = n; }
    if (b.bio !== undefined) u.bio = String(b.bio).slice(0, 160);
    if (b.cor) u.cor = b.cor;
    salvar();
    return privado(u);
  }],
  [/^\/biblioteca$/, (_m, b) => { const u = exigir(); u.biblioteca = b; salvar(); return { ok: true }; }],
  [/^\/admin\/aparencia$/, (_m, b) => { exigirAdmin(); Object.assign(estado.aparencia, b); salvar(); return estado.aparencia; }],
  [/^\/admin\/usuarios\/([^/]+)$/, ([, uid], b) => { exigirAdmin(); const u = acharUsuario(uid); u.papel = b.papel; salvar(); return publico(u); }],
  [/^\/admin\/animes\/([^/]+)$/, ([, slug], b) => {
    exigirAdmin();
    const a = acharAnime(slug);
    for (const c of ['titulo', 'sinopse', 'status']) if (b[c]) a[c] = b[c];
    if (Array.isArray(b.episodios)) a.episodios = b.episodios;
    edicoes[slug] = { titulo: a.titulo, sinopse: a.sinopse, status: a.status, episodios: a.episodios };
    gravar('edicoes', edicoes);
    return a;
  }],
];

function rotear(tabela, caminho, corpo) {
  const [rota, qs = ''] = caminho.split('?');
  for (const [padrao, fn] of tabela) {
    const m = rota.match(padrao);
    if (m) return structuredClone(fn(m, corpo ?? new URLSearchParams(qs)));
  }
  throw new Error('Rota não encontrada.');
}

export async function buscar(caminho) { return rotear(GET, caminho); }
export async function enviar(caminho, corpo, metodo = 'POST') { return rotear(metodo === 'PUT' ? PUT : POST, caminho, corpo ?? {}); }
export function definirToken(token) { if (!token) { sessaoId = null; gravar('sessao', null); } }

const cacheCapas = new Map();
export function capa(slug, tipo = 'poster', n) {
  const chave = `${slug}|${tipo}|${n ?? ''}`;
  if (!cacheCapas.has(chave)) {
    const titulo = acharAnime(slug)?.titulo ?? 'Yōkira';
    cacheCapas.set(chave, `data:image/svg+xml;charset=utf-8,${encodeURIComponent(gerarCapa({ slug, titulo, tipo, numero: n }))}`);
  }
  return cacheCapas.get(chave);
}
