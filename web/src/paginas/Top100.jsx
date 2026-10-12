import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useApi } from '../ganchos/useApi.js';
import { capa } from '../util/api.js';
import { Carregando, Erro } from '../componentes/Estado.jsx';
import './Top100.css';

const DECADAS = [['', 'Todos os tempos'], ['2020', 'Anos 2020'], ['2010', 'Anos 2010'], ['2000', 'Anos 2000'], ['antigos', 'Antes de 2000']];

export default function Top100() {
  const [decada, setDecada] = useState('');
  const { dados, erro, carregando } = useApi(`/top${decada ? `?decada=${decada}` : ''}`);
  return (
    <div className="pagina casca">
      <h1 className="pagina-titulo">Top 100</h1>
      <p className="secao-sub">Ordenado pela nota média da comunidade.</p>
      <div className="acervo-filtros top-filtros">
        {DECADAS.map(([valor, rotulo]) => (
          <button key={valor} className={`pilula pilula-botao ${decada === valor ? 'pilula-ativa' : ''}`} onClick={() => setDecada(valor)} aria-pressed={decada === valor}>{rotulo}</button>
        ))}
      </div>
      {carregando && <Carregando />}
      {erro && <Erro mensagem={erro} />}
      {dados?.length === 0 && <p className="vazio">Nenhum título avaliado nesse período.</p>}
      <ol className="top-lista">
        {dados?.map((a) => (
          <li key={a.slug}>
            <Link to={`/anime/${a.slug}`} className="top-item">
              <span className="top-pos">{a.posicao}</span>
              <img src={capa(a.slug)} alt="" loading="lazy" />
              <span className="top-info"><strong>{a.titulo}</strong><small>{a.formato} · {a.ano} · {a.estudio}</small><small>{a.generos.join(', ')}</small></span>
              <span className="nota top-nota"><Star size={16} fill="currentColor" />{a.nota}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
