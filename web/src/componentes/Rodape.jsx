import { Link } from 'react-router-dom';
import { Logo } from './Topo.jsx';
import './Rodape.css';

const COLUNAS = [
  ['Explorar', [['/acervo?status=no-ar', 'No ar agora'], ['/agenda', 'Agenda semanal'], ['/top100', 'Top 100'],
    ['/acervo?ordem=em-alta', 'Em alta'], ['/acervo?ordem=nota', 'Mais bem avaliados'], ['/acervo?ordem=recentes', 'Lançamentos']]],
  ['Gêneros', [['/acervo?genero=acao', 'Ação'], ['/acervo?genero=romance', 'Romance'], ['/acervo?genero=comedia', 'Comédia'],
    ['/acervo?genero=fantasia', 'Fantasia'], ['/acervo?genero=terror', 'Terror'], ['/acervo?genero=slice-of-life', 'Slice of Life']]],
  ['Você', [['/minha-lista', 'Minha lista'], ['/minha-lista?aba=favoritos', 'Favoritos'], ['/minha-lista?aba=historico', 'Continuar assistindo'], ['/noticias', 'Notícias']]],
];

export default function Rodape() {
  return (
    <footer className="rodape">
      <div className="casca rodape-grade">
        <div className="rodape-marca">
          <Logo />
          <p>Assista, acompanhe a temporada e organize sua lista em um só lugar.</p>
        </div>
        {COLUNAS.map(([titulo, links]) => (
          <nav key={titulo} aria-label={titulo}>
            <h2>{titulo}</h2>
            <ul>{links.map(([para, rotulo]) => <li key={para}><Link to={para}>{rotulo}</Link></li>)}</ul>
          </nav>
        ))}
      </div>
      <div className="casca rodape-base">© {new Date().getFullYear()} Yōkira Animes · Catálogo de demonstração</div>
    </footer>
  );
}
