import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { capa } from '../util/api.js';
import { ROTULO_STATUS, dataCurta } from '../util/formatos.js';
import './CartaoPoster.css';

// Cartão vertical usado em grades e linhas. "selo" mostra posição (ranking) ou aviso.
export default function CartaoPoster({ anime, posicao, selo, mostrarEstreia = false }) {
  const info = mostrarEstreia
    ? `Estreia ${dataCurta(anime.dataEstreia)}`
    : `${anime.formato} · ${anime.episodiosDisponiveis}/${anime.totalEpisodios} eps`;
  return (
    <Link to={`/anime/${anime.slug}`} className="poster">
      <div className="poster-capa">
        <img src={capa(anime.slug)} alt="" loading="lazy" width="400" height="600" />
        {posicao && <span className="poster-posicao">{posicao}</span>}
        {anime.status === 'no-ar' && !selo && <span className="poster-vivo">No ar</span>}
        {selo && <span className="poster-selo">{selo}</span>}
        {anime.dublado && <span className="poster-dub">Dub</span>}
      </div>
      <h3 className="poster-titulo">{anime.titulo}</h3>
      <p className="poster-meta">
        {anime.nota ? <span className="nota"><Star size={12} fill="currentColor" />{anime.nota}</span> : <span>{ROTULO_STATUS[anime.status]}</span>}
        <span>{info}</span>
      </p>
    </Link>
  );
}
