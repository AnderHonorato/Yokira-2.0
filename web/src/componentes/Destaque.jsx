import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Plus, Check, Star } from 'lucide-react';
import { capa } from '../util/api.js';
import { useBiblioteca } from '../ganchos/useBiblioteca.jsx';
import './Destaque.css';

// Vitrine principal: um título por vez, troca sozinha a cada 8s (pausa ao passar o mouse)
export default function Destaque({ itens }) {
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);
  const bib = useBiblioteca();
  const atual = itens[indice];

  useEffect(() => {
    if (pausado || itens.length < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const relogio = setTimeout(() => setIndice((i) => (i + 1) % itens.length), 8000);
    return () => clearTimeout(relogio);
  }, [indice, pausado, itens.length]);

  if (!atual) return null;
  const naLista = bib.naLista(atual.slug);
  const progresso = bib.progresso[atual.slug];

  return (
    <section className="destaque" onMouseEnter={() => setPausado(true)} onMouseLeave={() => setPausado(false)} aria-roledescription="carrossel">
      <img key={atual.slug} className="destaque-fundo" src={capa(atual.slug, 'banner')} alt="" />
      <div className="destaque-conteudo">
        <p className="destaque-sobre">Episódio {atual.episodiosDisponiveis} disponível · {atual.estudio}</p>
        <h1 className="destaque-titulo">{atual.titulo}</h1>
        <p className="destaque-meta">
          {atual.nota && <span className="nota"><Star size={14} fill="currentColor" />{atual.nota}</span>}
          <span>{atual.ano}</span><span>{atual.formato}</span><span>{atual.generos.slice(0, 3).join(', ')}</span>
        </p>
        <p className="destaque-sinopse">{atual.sinopse}</p>
        <div className="destaque-botoes">
          <Link className="btn btn-primario" to={`/assistir/${atual.slug}/${progresso?.numero ?? 1}`}>
            <Play size={16} fill="currentColor" />{progresso ? `Continuar ep. ${progresso.numero}` : 'Assistir ep. 1'}
          </Link>
          <button className={`btn btn-contorno ${naLista ? 'btn-ativo' : ''}`} onClick={() => bib.alternarLista(atual)}>
            {naLista ? <Check size={16} /> : <Plus size={16} />}{naLista ? 'Na sua lista' : 'Minha lista'}
          </button>
          <Link className="btn btn-contorno" to={`/anime/${atual.slug}`}>Detalhes</Link>
        </div>
      </div>
      <div className="destaque-fita" role="tablist" aria-label="Escolher destaque">
        {itens.map((item, i) => (
          <button key={item.slug} role="tab" aria-selected={i === indice} className="destaque-miniatura" onClick={() => setIndice(i)}>
            <img src={capa(item.slug)} alt="" loading="lazy" />
            <span>{item.titulo}</span>
            {i === indice && <i className={`destaque-barra ${pausado ? 'pausada' : ''}`} key={indice} />}
          </button>
        ))}
      </div>
    </section>
  );
}
