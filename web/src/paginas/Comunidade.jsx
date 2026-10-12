import { Link } from 'react-router-dom';
import { Star, Zap } from 'lucide-react';
import { useApi } from '../ganchos/useApi.js';
import Avatar, { SeloTier } from '../componentes/Avatar.jsx';
import { Carregando, Erro } from '../componentes/Estado.jsx';
import Revelar from '../componentes/Revelar.jsx';
import { milhar } from '../util/formatos.js';
import './Comunidade.css';

export const tempoAtras = (iso) => {
  const s = (Date.now() - new Date(iso)) / 1000;
  if (s < 60) return 'agora';
  if (s < 3600) return `há ${Math.floor(s / 60)} min`;
  if (s < 86400) return `há ${Math.floor(s / 3600)} h`;
  return `há ${Math.floor(s / 86400)} d`;
};

export default function Comunidade() {
  const { dados, erro, carregando } = useApi('/comunidade');
  if (carregando) return <Carregando />;
  if (erro) return <Erro mensagem={erro} />;
  const [primeiro, segundo, terceiro] = dados.topXp;

  return (
    <div className="pagina casca comunidade">
      <h1 className="pagina-titulo">Comunidade</h1>
      <p className="secao-sub">{dados.totalMembros} membros assistindo, avaliando e conversando.</p>

      <section className="podio" aria-label="Hall da fama">
        {[segundo, primeiro, terceiro].filter(Boolean).map((u) => {
          const pos = dados.topXp.indexOf(u) + 1;
          return (
            <Link key={u.id} to={`/perfil/${u.id}`} className={`podio-lugar lugar-${pos}`}>
              <span className="podio-coroa">{pos}º</span>
              <Avatar usuario={u} tamanho={pos === 1 ? 84 : 64} />
              <strong>{u.nome}</strong>
              <SeloTier tier={u.tier} />
              <small>{milhar(u.xp)} XP</small>
              <span className="podio-base" />
            </Link>
          );
        })}
      </section>

      <div className="comunidade-grade">
        <Revelar className="caixa">
          <h2 className="caixa-titulo"><span className="ao-vivo" />Atividade ao vivo</h2>
          <ul className="feed">
            {dados.atividades.map((a) => (
              <li key={a.id}>
                <Avatar usuario={a.usuario} tamanho={30} anel={false} />
                <p><Link to={`/perfil/${a.usuario.id}`}><strong>{a.usuario.nome}</strong></Link> {a.acao}<small>{tempoAtras(a.em)}</small></p>
                {a.pontos > 0 && <span className="feed-xp"><Zap size={12} />+{a.pontos}</span>}
              </li>
            ))}
          </ul>
        </Revelar>

        <div className="comunidade-col">
          <Revelar className="caixa">
            <h2 className="caixa-titulo">Top 10 por XP</h2>
            <ol className="lista-top">
              {dados.topXp.map((u, i) => (
                <li key={u.id}><Link to={`/perfil/${u.id}`}><span className="lista-top-pos">{i + 1}</span><Avatar usuario={u} tamanho={28} /><strong>{u.nome}</strong><small>{milhar(u.xp)}</small></Link></li>
              ))}
            </ol>
            <Link to="/ranking" className="secao-link">Ranking completo</Link>
          </Revelar>
          <Revelar className="caixa">
            <h2 className="caixa-titulo">Chegaram agora</h2>
            <div className="recentes">{dados.recentes.map((u) => <Link key={u.id} to={`/perfil/${u.id}`} title={u.nome}><Avatar usuario={u} tamanho={40} /></Link>)}</div>
          </Revelar>
        </div>
      </div>

      <Revelar className="secao">
        <h2 className="secao-titulo">Últimas avaliações</h2>
        {dados.resenhas.length === 0 && <p className="vazio">Ninguém avaliou ainda. Abra um anime e escreva a primeira.</p>}
        <div className="resenhas">
          {dados.resenhas.map((r) => (
            <Link key={r.id} to={`/anime/${r.slug}`} className="resenha">
              <p className="resenha-topo">{r.autor && <Avatar usuario={r.autor} tamanho={26} anel={false} />}<strong>{r.nome}</strong>{r.nota && <span className="nota"><Star size={12} fill="currentColor" />{r.nota / 2}</span>}</p>
              <p className="resenha-texto">“{r.texto}”</p>
              <small>sobre {r.titulo}</small>
            </Link>
          ))}
        </div>
      </Revelar>
    </div>
  );
}
