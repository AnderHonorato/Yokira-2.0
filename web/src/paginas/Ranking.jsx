import { Link } from 'react-router-dom';
import { useApi } from '../ganchos/useApi.js';
import { useSessao } from '../ganchos/useSessao.jsx';
import Avatar, { SeloTier } from '../componentes/Avatar.jsx';
import { Carregando, Erro } from '../componentes/Estado.jsx';
import { milhar } from '../util/formatos.js';
import './Ranking.css';

export default function Ranking() {
  const { dados, erro, carregando } = useApi('/ranking');
  const { usuario } = useSessao();
  if (carregando) return <Carregando />;
  if (erro) return <Erro mensagem={erro} />;
  const maior = Math.max(1, ...dados.distribuicao.map((d) => d.total));
  const eu = dados.lista.find((u) => u.id === usuario?.id);

  return (
    <div className="pagina casca">
      <h1 className="pagina-titulo">Ranking da comunidade</h1>
      <p className="secao-sub">Assistir episódio +10 · avaliar +15 · tópico no fórum +20 · votar +5 · mensagem no chat +2</p>
      {eu && <p className="ranking-eu">Você está em <strong>{eu.posicao}º</strong> com {milhar(eu.xp)} XP{eu.tier.proximo && <> · faltam {eu.tier.faltam} XP para {eu.tier.proximo}</>}</p>}

      <div className="ranking-grade">
        <ol className="ranking-tabela">
          {dados.lista.map((u, i) => (
            <li key={u.id} style={{ animationDelay: `${Math.min(i, 15) * 40}ms` }} className={u.id === usuario?.id ? 'sou-eu' : ''}>
              <Link to={`/perfil/${u.id}`}>
                <span className={`rt-pos pos-${u.posicao}`}>{u.posicao}</span>
                <Avatar usuario={u} tamanho={40} />
                <span className="rt-nome"><strong>{u.nome}</strong><SeloTier tier={u.tier} /></span>
                <span className="rt-barra"><i style={{ width: `${(u.xp / dados.lista[0].xp) * 100}%`, background: u.tier.cor }} /></span>
                <span className="rt-xp">{milhar(u.xp)} XP</span>
              </Link>
            </li>
          ))}
        </ol>
        <aside className="caixa">
          <h2 className="caixa-titulo">Distribuição por tier</h2>
          <ul className="tiers">
            {dados.distribuicao.map((t, i) => (
              <li key={t.nome}>
                <span className="selo-tier" style={{ '--c': t.cor }}>{t.nome}</span>
                <span className="tiers-barra"><i style={{ width: `${(t.total / maior) * 100}%`, background: t.cor, animationDelay: `${i * 90}ms` }} /></span>
                <small>{t.total}</small>
                <small className="tiers-min">{milhar(dados.tiers[i].minimo)}+ XP</small>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
