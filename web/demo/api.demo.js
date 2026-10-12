// Modo demonstração: substitui a API real por dados locais (usado só no build "demo",
// para publicar o visual como página estática). Mesmas rotas e respostas do servidor.
import banco from '../../servidor/src/dados/banco.json';
import { gerarCapa } from '../../servidor/src/servicos/capa.js';
import { resumir } from '../../servidor/src/servicos/resumo.js';
import videoDemo from './video-demo.webm';

const slugificar = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const normalizar = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const GENEROS = [...new Set(banco.animes.flatMap((a) => a.generos))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
const ORDENS = {
  popularidade: (a, b) => b.popularidade - a.popularidade, nota: (a, b) => (b.nota ?? 0) - (a.nota ?? 0),
  'em-alta': (a, b) => b.tendencia - a.tendencia, recentes: (a, b) => b.dataEstreia.localeCompare(a.dataEstreia),
  antigos: (a, b) => a.dataEstreia.localeCompare(b.dataEstreia), 'a-z': (a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'),
};
const ordenar = (l, c) => [...l].sort((a, b) => (b[c] ?? 0) - (a[c] ?? 0));
const acharAnime = (slug) => banco.animes.find((a) => a.slug === slug);
banco.animes.forEach((a) => a.episodios.forEach((e) => { e.urlVideo = videoDemo; }));

function lerComentarios() { try { return JSON.parse(localStorage.getItem('yokira:comentarios')) ?? {}; } catch { return {}; } }

const rotas = [
  [/^\/inicio$/, () => {
    const noAr = banco.animes.filter((a) => a.status === 'no-ar');
    return {
      destaques: ordenar(noAr, 'tendencia').slice(0, 5).map(resumir), emAlta: ordenar(banco.animes, 'tendencia').slice(0, 10).map(resumir),
      noAr: noAr.map(resumir), top: ordenar(banco.animes.filter((a) => a.nota), 'nota').slice(0, 12).map(resumir),
      emBreve: banco.animes.filter((a) => a.status === 'em-breve').sort((a, b) => a.dataEstreia.localeCompare(b.dataEstreia)).map(resumir),
      encerrando: noAr.filter((a) => a.totalEpisodios - a.episodios.filter((e) => e.disponivel).length <= 2).map(resumir),
      noticias: banco.noticias.slice(0, 4), ranking: banco.ranking.slice(0, 5),
      estatisticas: { noAr: noAr.length, episodiosTemporada: noAr.reduce((s, a) => s + a.episodios.filter((e) => e.disponivel).length, 0), titulos: banco.animes.length },
    };
  }],
  [/^\/filtros$/, () => ({
    generos: GENEROS.map((nome) => ({ nome, slug: slugificar(nome) })), anos: [...new Set(banco.animes.map((a) => a.ano))].sort((a, b) => b - a),
    formatos: ['TV', 'Filme', 'OVA', 'ONA', 'Especial'], temporadas: ['inverno', 'primavera', 'verao', 'outono'],
    status: ['no-ar', 'finalizado', 'em-breve'], ordens: Object.keys(ORDENS),
  })],
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
  [/^\/animes\/([^/]+)\/comentarios$/, ([, slug]) => lerComentarios()[slug] ?? []],
  [/^\/animes\/([^/]+)$/, ([, slug]) => {
    const anime = acharAnime(slug);
    if (!anime) throw new Error('Anime não encontrado.');
    return { ...anime, relacionados: banco.animes.filter((a) => a.slug !== slug && a.generos.some((g) => anime.generos.includes(g))).slice(0, 6).map(resumir) };
  }],
  [/^\/agenda$/, () => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    return { data: d.toISOString().slice(0, 10), diaSemana: d.getDay(), itens: banco.animes
      .filter((a) => a.status === 'no-ar' && a.diaExibicao === d.getDay()).sort((a, b) => a.horario.localeCompare(b.horario))
      .map((a) => ({ ...resumir(a), proximoEpisodio: Math.min(a.totalEpisodios, a.episodios.filter((e) => e.disponivel).length + 1) })) };
  })],
  [/^\/top$/, (_m, q) => {
    const f = { 2020: [2020, 2029], 2010: [2010, 2019], 2000: [2000, 2009], antigos: [0, 1999] }[q.get('decada')];
    return ordenar(banco.animes.filter((a) => a.nota && (!f || (a.ano >= f[0] && a.ano <= f[1]))), 'nota').slice(0, 100).map((a, i) => ({ posicao: i + 1, ...resumir(a) }));
  }],
  [/^\/noticias$/, () => banco.noticias],
  [/^\/noticias\/([^/]+)$/, ([, slug]) => { const n = banco.noticias.find((x) => x.slug === slug); if (!n) throw new Error('Notícia não encontrada.'); return n; }],
];

export async function buscar(caminho) {
  const [rota, qs = ''] = caminho.split('?');
  for (const [padrao, fn] of rotas) {
    const m = rota.match(padrao);
    if (m) return structuredClone(fn(m, new URLSearchParams(qs)));
  }
  throw new Error('Rota não encontrada.');
}

export async function enviar(caminho, corpo) {
  const slug = caminho.split('/')[2];
  const texto = String(corpo.texto ?? '').trim();
  if (texto.length < 3) throw new Error('Escreva pelo menos 3 caracteres.');
  const novo = { id: Date.now(), nome: String(corpo.nome ?? '').trim() || 'Anônimo', texto, nota: corpo.nota || null, data: new Date().toISOString() };
  const todos = lerComentarios();
  todos[slug] = [novo, ...(todos[slug] ?? [])];
  try { localStorage.setItem('yokira:comentarios', JSON.stringify(todos)); } catch { /* sem armazenamento */ }
  return novo;
}

const cacheCapas = new Map();
export function capa(slug, tipo = 'poster', n) {
  const chave = `${slug}|${tipo}|${n ?? ''}`;
  if (!cacheCapas.has(chave)) {
    const titulo = acharAnime(slug)?.titulo ?? 'Yōkira';
    cacheCapas.set(chave, `data:image/svg+xml;charset=utf-8,${encodeURIComponent(gerarCapa({ slug, titulo, tipo, numero: n }))}`);
  }
  return cacheCapas.get(chave);
}
