'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { previaBanner, type BannerDestaqueDTO } from '../../lib/banners';
import { criarRelogioBanner, type RelogioBanner } from '../../lib/relogio-banner';
import './banner-destaque.css';
type Props = { navegar: (pagina: string, valores?: Record<string, string>) => void };
export default function BannerDestaque({ navegar }: Props) {
 const [banners, setBanners] = useState<BannerDestaqueDTO[]>([]);
 const [indice, setIndice] = useState(0), [pausado, setPausado] = useState(false), [interagindo, setInteragindo] = useState(false);
 const [visivel, setVisivel] = useState(true), [naTela, setNaTela] = useState(true), [reduzir, setReduzir] = useState(false);
 const [carregando, setCarregando] = useState(true), [erro, setErro] = useState(false), [tentativa, setTentativa] = useState(0);
 const raiz = useRef<HTMLElement>(null), toque = useRef<number | null>(null);
 const progresso = useRef<HTMLSpanElement>(null), relogio = useRef<RelogioBanner | null>(null);
 const [reinicio, setReinicio] = useState(0);
 useEffect(() => {
  const controle = new AbortController(); let ativo = true;
  async function carregar() {
   if (document.visibilityState === 'hidden') return;
   try {
    const resposta = await fetch('/api/yokira?acao=banners', { signal: controle.signal, cache: 'no-store' });
    if (!resposta.ok) throw new Error();
    const dados = await resposta.json() as { banners: BannerDestaqueDTO[] };
    if (!Array.isArray(dados.banners)) throw new Error('Resposta de destaques inválida.');
    if (ativo) { setBanners(dados.banners); setErro(false); }
   } catch { if (ativo && !controle.signal.aborted) setErro(true); }
   finally { if (ativo) setCarregando(false); }
  }
  void carregar(); const intervalo = window.setInterval(() => void carregar(), 60000);
  document.addEventListener('visibilitychange', carregar); window.addEventListener('yokira:banners', carregar);
  return () => { ativo = false; controle.abort(); clearInterval(intervalo); document.removeEventListener('visibilitychange', carregar); window.removeEventListener('yokira:banners', carregar); };
 }, [tentativa]);
 useEffect(() => {
  const midia = window.matchMedia('(prefers-reduced-motion: reduce)');
  const atualizar = () => setReduzir(midia.matches), visibilidade = () => setVisivel(document.visibilityState !== 'hidden');
  atualizar(); visibilidade(); midia.addEventListener('change', atualizar); document.addEventListener('visibilitychange', visibilidade);
  return () => { midia.removeEventListener('change', atualizar); document.removeEventListener('visibilitychange', visibilidade); };
 }, []);
 useEffect(() => {
  if (!raiz.current) return;
  const observador = new IntersectionObserver(([entrada]) => setNaTela(entrada.isIntersecting), { threshold: .15 });
  observador.observe(raiz.current); return () => observador.disconnect();
 }, [carregando]);
 const atual = banners[indice % Math.max(1, banners.length)];
 const rodando = !pausado && !interagindo && visivel && naTela && !reduzir;
 const total = banners.length, duracao = (atual?.intervaloEfetivoSegundos || 0) * 1000;
 const identidade = atual ? `${atual.id}:${atual.atualizadoEm}:${indice}:${reinicio}` : '';
 useEffect(() => {
  if (!progresso.current || total < 2 || reduzir) return;
  const novo = criarRelogioBanner(progresso.current, duracao, () => setIndice(valor => (valor + 1) % total));
  relogio.current = novo;
  return () => { novo.destruir(); if (relogio.current === novo) relogio.current = null; };
 }, [identidade, duracao, total, reduzir]);
 useEffect(() => { relogio.current?.definirRodando(rodando); }, [rodando, identidade, duracao, total, reduzir]);
 useEffect(() => {
  if (banners.length < 2) return;
  const proximo = banners[(indice + 1) % banners.length]; const cena = new Image(); cena.src = proximo.imagem;
  if (proximo.personagem) { const figura = new Image(); figura.src = proximo.personagem; }
 }, [banners, indice]);
 function selecionar(posicao: number) { setIndice(posicao); setReinicio(valor => valor + 1); }
 function trocar(passo: number) { selecionar((indice + passo + total) % total); }
 if (carregando) return <section className="banner-destaque banner-carregando" aria-label="Destaques" aria-busy="true"><span>Carregando destaques…</span></section>;
 if (!atual) return erro ? <div className="banner-falha" role="status">Não foi possível carregar os destaques. <button className="button button-subtle" onClick={() => { setCarregando(true); setTentativa(v => v + 1); }}>Tentar novamente</button></div> : null;
 const previa = previaBanner(atual.imagem);
 return <section ref={raiz} className="banner-destaque" aria-label="Animes em destaque" aria-roledescription="carrossel" data-pausado={!rodando}
  onMouseEnter={() => setInteragindo(true)} onMouseLeave={() => { if (!raiz.current?.contains(document.activeElement)) setInteragindo(false); }}
  onFocusCapture={() => setInteragindo(true)} onBlurCapture={evento => { if (!evento.currentTarget.contains(evento.relatedTarget)) setInteragindo(false); }}
  onKeyDown={evento => { if (evento.key === 'ArrowLeft' || evento.key === 'ArrowRight') { evento.preventDefault(); trocar(evento.key === 'ArrowRight' ? 1 : -1); } }}
  onTouchStart={evento => { toque.current = evento.touches[0].clientX; }} onTouchEnd={evento => { const inicio = toque.current; toque.current = null; if (inicio !== null && Math.abs(evento.changedTouches[0].clientX - inicio) > 45) trocar(evento.changedTouches[0].clientX < inicio ? 1 : -1); }}>
  <div key={atual.id + atual.atualizadoEm} className="banner-slide" role="group" aria-roledescription="slide" aria-label={`${indice % banners.length + 1} de ${banners.length}: ${atual.titulo.nome}`}>
   <div className="banner-arte" aria-hidden="true" style={previa ? { backgroundImage: `url("${previa}")` } : undefined}>
    <img className="banner-cenario" src={atual.imagem} alt="" decoding="async" fetchPriority="high" onError={evento => { evento.currentTarget.style.opacity = '0'; }}/>
    <div className="banner-aurora"/><div className="banner-particulas"/>
    {atual.personagem && <img className="banner-personagem" src={atual.personagem} alt="" decoding="async" onError={evento => { evento.currentTarget.style.visibility = 'hidden'; }}/>}
    <div className="banner-sombra"/>
   </div>
   <div className="banner-texto"><span className="banner-sobrelinha">EM DESTAQUE</span><h2>{atual.titulo.nome}</h2>
    <div className="banner-generos"><span>{atual.titulo.ano}</span>{atual.titulo.generos.slice(0, 3).map(genero => <span key={genero}>{genero}</span>)}</div>
    <p>{atual.titulo.sinopse}</p><div className="banner-acoes"><button className="button button-primary" onClick={() => navegar('titulo', { id: atual.tituloId })}><Play size={16} fill="currentColor" aria-hidden="true"/>Assistir título</button>
     {atual.link && <a className="button button-subtle" href={atual.link} target={atual.link.startsWith('https:') ? '_blank' : undefined} rel="noopener noreferrer">Saiba mais<span className="sr-only"> sobre {atual.titulo.nome}</span></a>}</div>
   </div>
  </div>
  {banners.length > 1 && <div className="banner-controles"><div className="banner-paginacao" aria-label="Escolher destaque">{banners.map((item, posicao) => <button key={item.id} aria-label={`Mostrar ${item.titulo.nome}`} aria-pressed={posicao === indice % banners.length} onClick={() => selecionar(posicao)}><span ref={posicao === indice % total ? progresso : undefined}/></button>)}</div>
   <span className="banner-contagem" aria-hidden="true">{String(indice % banners.length + 1).padStart(2, '0')} / {String(banners.length).padStart(2, '0')}</span>
   <button onClick={() => trocar(-1)} aria-label="Destaque anterior"><ChevronLeft size={19}/></button><button onClick={() => setPausado(!pausado)} aria-label={pausado ? 'Retomar rotação dos destaques' : 'Pausar rotação dos destaques'} aria-pressed={pausado}>{pausado ? <Play size={15}/> : <Pause size={15}/>}</button><button onClick={() => trocar(1)} aria-label="Próximo destaque"><ChevronRight size={19}/></button>
  </div>}
 </section>;
}
