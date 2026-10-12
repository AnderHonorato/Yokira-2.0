import { Link } from 'react-router-dom';
import { useApi } from '../ganchos/useApi.js';
import { capa } from '../util/api.js';
import { dataCurta } from '../util/formatos.js';
import { Carregando, Erro } from '../componentes/Estado.jsx';
import './Noticias.css';

export default function Noticias() {
  const { dados, erro, carregando } = useApi('/noticias');
  if (carregando) return <Carregando />;
  if (erro) return <Erro mensagem={erro} />;
  const [principal, ...resto] = dados;
  return (
    <div className="pagina casca">
      <h1 className="pagina-titulo">Notícias</h1>
      <Link to={`/noticias/${principal.slug}`} className="noticia-principal">
        <img src={capa(principal.animeSlug, 'banner')} alt="" />
        <span><span className="chip">{principal.tag}</span><strong>{principal.titulo}</strong><small>{principal.resumo}</small></span>
      </Link>
      <ul className="noticias-lista">
        {resto.map((n) => (
          <li key={n.slug}><Link to={`/noticias/${n.slug}`} className="noticia-linha">
            <img src={capa(n.animeSlug, 'ep', 1)} alt="" loading="lazy" />
            <span><span className="chip">{n.tag}</span><strong>{n.titulo}</strong><small>{dataCurta(n.data)} · {n.resumo}</small></span>
          </Link></li>
        ))}
      </ul>
    </div>
  );
}
