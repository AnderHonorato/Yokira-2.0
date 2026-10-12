import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Plus, Check, Star, ChevronDown, Info } from 'lucide-react';
import { capa } from '../util/api.js';
import { useBiblioteca } from '../ganchos/useBiblioteca.jsx';
import { useAvisos } from '../ganchos/useAvisos.jsx';
import Particulas from './Particulas.jsx';
import PainelRanking from './PainelRanking.jsx';
import './HeroTela.css';

const TEMPO = 9000;

// Destaque de tela cheia. O fundo vem do painel admin (imagem, vídeo ou gradiente animado).
export default function HeroTela({ itens, aparencia, ranking, estatisticas }) {
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);
  const bib = useBiblioteca();
  const avisar = useAvisos();
  const atual = itens[indice];

  useEffect(() => {
    if (pausado || itens.length < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setTimeout(() => setIndice((i) => (i + 1) % itens.length), TEMPO);
    return () => clearTimeout(t);
  }, [indice, pausado, itens.length]);

  if (!atual) return null;
  const naLista = bib.naLista(atual.slug);
  const progresso = bib.progresso[atual.slug];
  const escurecer = (aparencia?.heroEscurecer ?? 55) / 100;
  const tipo = aparencia?.heroUrl ? aparencia.heroTipo : 'gradiente';

  const alternarLista = () => { bib.alternarLista(atual); avisar(naLista ? 'Removido da sua lista' : 'Adicionado à sua lista'); };

  return (
    <section className="hero" style={{ '--escurecer': escurecer }} onMouseEnter={() => setPausado(true)} onMouseLeave={() => setPausado(false)} aria-roledescription="carrossel" aria-label="Destaques">
      <div className="hero-fundo" aria-hidden="true">
        {tipo === 'video' && <video src={aparencia.heroUrl} autoPlay muted loop playsInline />}
        {tipo === 'imagem' && <img src={aparencia.heroUrl} alt="" className="hero-kenburns" />}
        {tipo === 'gradiente' && (
          <>
            <img key={atual.slug} src={capa(atual.slug, 'banner')} alt="" className="hero-kenburns hero-capa-fundo" />
            <div className="hero-aurora"><span /><span /><span /></div>
          </>
        )}
        <div className="hero-veu" />
        <div className="hero-grao" />
        {aparencia?.particulas !== false && <Particulas />}
      </div>

      <div className="casca hero-grade">
        <div className="hero-texto" key={atual.slug}>
          <p className="hero-sobre"><span className="hero-ponto" />Em exibição · episódio {atual.episodiosDisponiveis} já disponível</p>
          <h1 className="hero-titulo">{atual.titulo}</h1>
          <p className="hero-meta">
            {atual.nota && <span className="nota"><Star size={15} fill="currentColor" />{atual.nota}</span>}
            <span>{atual.ano}</span><span>{atual.formato}</span><span>{atual.estudio}</span>
            {atual.dublado && <span className="hero-tag">Dublado</span>}
          </p>
          <p className="hero-sinopse">{atual.sinopse}</p>
          <div className="hero-botoes">
            <Link className="btn btn-primario btn-grande" to={`/assistir/${atual.slug}/${progresso?.numero ?? 1}`}>
              <Play size={18} fill="currentColor" />{progresso ? `Continuar ep. ${progresso.numero}` : 'Assistir agora'}
            </Link>
            <button className={`btn btn-vidro btn-grande ${naLista ? 'btn-ativo' : ''}`} onClick={alternarLista}>
              <span className={naLista ? 'icone-carimbo' : ''}>{naLista ? <Check size={18} /> : <Plus size={18} />}</span>{naLista ? 'Na lista' : 'Minha lista'}
            </button>
            <Link className="btn btn-vidro btn-grande btn-icone-texto" to={`/anime/${atual.slug}`} aria-label="Detalhes"><Info size={18} /><span>Detalhes</span></Link>
          </div>
        </div>

        <div className="hero-lateral">
          {ranking?.length > 0 && <PainelRanking ranking={ranking} vidro />}
          {estatisticas && (
            <dl className="hero-numeros">
              <div><dt>No ar</dt><dd>{estatisticas.noAr}</dd></div>
              <div><dt>Episódios na temporada</dt><dd>{estatisticas.episodiosTemporada}</dd></div>
              <div><dt>Títulos</dt><dd>{estatisticas.titulos}</dd></div>
            </dl>
          )}
        </div>
      </div>

      <div className="casca hero-fita" role="tablist" aria-label="Escolher destaque">
        {itens.map((item, i) => (
          <button key={item.slug} role="tab" aria-selected={i === indice} className="hero-miniatura" onClick={() => setIndice(i)}>
            <img src={capa(item.slug)} alt="" loading="lazy" />
            <span>{item.titulo}</span>
            {i === indice && <i className={`hero-barra ${pausado ? 'pausada' : ''}`} key={indice} style={{ animationDuration: `${TEMPO}ms` }} />}
          </button>
        ))}
      </div>
      <a href="#conteudo" className="hero-rolar" aria-label="Rolar para o conteúdo"><ChevronDown size={22} /></a>
    </section>
  );
}
