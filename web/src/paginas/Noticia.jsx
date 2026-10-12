import { Link, useParams } from 'react-router-dom';
import { useApi } from '../ganchos/useApi.js';
import { capa } from '../util/api.js';
import { dataCurta } from '../util/formatos.js';
import { Carregando, Erro } from '../componentes/Estado.jsx';
import './Noticias.css';

export default function Noticia() {
  const { slug } = useParams();
  const { dados: n, erro, carregando } = useApi(`/noticias/${slug}`);
  if (carregando) return <Carregando />;
  if (erro) return <Erro mensagem={erro} />;
  return (
    <article className="pagina casca artigo">
      <Link to="/noticias" className="secao-link">Todas as notícias</Link>
      <span className="chip">{n.tag}</span>
      <h1 className="artigo-titulo">{n.titulo}</h1>
      <p className="secao-sub">{dataCurta(n.data)}</p>
      <img src={capa(n.animeSlug, 'banner')} alt="" className="artigo-imagem" />
      {n.corpo.map((p, i) => <p key={i}>{p}</p>)}
      <Link to={`/anime/${n.animeSlug}`} className="btn btn-primario">Ver o anime</Link>
    </article>
  );
}
