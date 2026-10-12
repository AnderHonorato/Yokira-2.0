import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Crown } from 'lucide-react';
import { buscar, enviar, capa } from '../util/api.js';
import { useSessao } from '../ganchos/useSessao.jsx';
import { useAvisos } from '../ganchos/useAvisos.jsx';
import { Carregando, Erro } from '../componentes/Estado.jsx';
import './AnimeDaSemana.css';

export default function AnimeDaSemana() {
  const { usuario, abrirLogin } = useSessao();
  const avisar = useAvisos();
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(null);
  const carregar = () => buscar('/votacao', { semCache: true }).then(setDados).catch((e) => setErro(e.message));
  useEffect(() => { carregar(); }, [usuario?.id]);
  if (erro) return <Erro mensagem={erro} />;
  if (!dados) return <Carregando />;

  const votar = async (slug) => {
    if (!usuario) return abrirLogin();
    try { await enviar('/votacao', { slug }); avisar('Voto registrado. +5 XP', 'xp'); carregar(); }
    catch (e) { avisar(e.message, 'erro'); }
  };
  const lider = dados.total ? dados.candidatos[0] : null;

  return (
    <div className="pagina casca">
      <h1 className="pagina-titulo">Anime da semana</h1>
      <p className="secao-sub">Um voto por conta a cada semana. {dados.total} {dados.total === 1 ? 'voto' : 'votos'} até agora.</p>
      {lider && (
        <Link to={`/anime/${lider.slug}`} className="ads-lider">
          <img src={capa(lider.slug, 'banner')} alt="" />
          <span><Crown size={18} />Liderando com {lider.percentual}%</span>
          <strong>{lider.titulo}</strong>
        </Link>
      )}
      <ol className="ads-lista">
        {dados.candidatos.map((a, i) => {
          const meu = dados.meuVoto === a.slug;
          return (
            <li key={a.slug} className={meu ? 'meu' : ''} style={{ animationDelay: `${i * 40}ms` }}>
              <img src={capa(a.slug)} alt="" loading="lazy" />
              <div className="ads-info">
                <Link to={`/anime/${a.slug}`}><strong>{a.titulo}</strong></Link>
                <span className="ads-barra"><i style={{ width: `${a.percentual}%` }} /></span>
                <small>{a.percentual}% · {a.votos} {a.votos === 1 ? 'voto' : 'votos'}</small>
              </div>
              {dados.meuVoto
                ? meu && <span className="chip ads-votado"><Check size={13} />Seu voto</span>
                : <button className="btn btn-contorno" onClick={() => votar(a.slug)}>Votar</button>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
