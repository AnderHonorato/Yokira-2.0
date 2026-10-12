import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { milhar } from '../util/formatos.js';
import Avatar from './Avatar.jsx';
import './PainelRanking.css';

// Placar da comunidade por XP (contas reais, via /api/inicio ou /api/ranking)
export default function PainelRanking({ ranking }) {
  return (
    <aside className="ranking" aria-labelledby="ranking-titulo">
      <div className="ranking-cabeca">
        <h2 id="ranking-titulo" className="ranking-titulo"><Trophy size={16} />Placar da comunidade</h2>
        <Link to="/ranking" className="secao-link">Ver todos</Link>
      </div>
      <ol className="ranking-lista">
        {ranking.map((p) => (
          <li key={p.id}>
            <Link to={`/perfil/${p.id}`} className="ranking-item">
              <span className={`ranking-pos pos-${p.posicao}`}>{p.posicao}</span>
              <Avatar usuario={p} tamanho={34} />
              <span className="ranking-nome"><strong>{p.nome}</strong><small style={{ color: p.tier?.cor }}>{p.tier?.nome}</small></span>
              <span className="ranking-xp">{milhar(p.xp)} XP</span>
            </Link>
          </li>
        ))}
      </ol>
      <p className="ranking-dica">Assista, avalie e converse para ganhar XP.</p>
    </aside>
  );
}
