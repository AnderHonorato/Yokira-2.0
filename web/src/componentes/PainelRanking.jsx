import { Trophy } from 'lucide-react';
import { milhar } from '../util/formatos.js';
import './PainelRanking.css';

// Placar da comunidade (XP). Os dados vêm de /api/ranking.
export default function PainelRanking({ ranking }) {
  return (
    <aside className="ranking" aria-labelledby="ranking-titulo">
      <h2 id="ranking-titulo" className="ranking-titulo"><Trophy size={16} />Placar da comunidade</h2>
      <ol className="ranking-lista">
        {ranking.map((p) => (
          <li key={p.nome} className="ranking-item">
            <span className={`ranking-pos pos-${p.posicao}`}>{p.posicao}</span>
            <span className="ranking-avatar" aria-hidden="true">{p.nome[0].toUpperCase()}</span>
            <span className="ranking-nome"><strong>{p.nome}</strong><small>{p.nivel}</small></span>
            <span className="ranking-xp">{milhar(p.xp)} XP</span>
          </li>
        ))}
      </ol>
      <p className="ranking-dica">Assista episódios e escreva avaliações para subir no placar.</p>
    </aside>
  );
}
