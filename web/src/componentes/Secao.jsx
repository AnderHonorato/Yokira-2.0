import { Link } from 'react-router-dom';
import Revelar from './Revelar.jsx';

// Cabeçalho padrão de seção: título, subtítulo opcional e link "ver tudo"
export default function Secao({ titulo, sub, link, rotuloLink = 'Ver tudo', children, id }) {
  return (
    <Revelar como="section" className="secao" id={id}>
      <div className="secao-cabecalho">
        <div><h2 className="secao-titulo">{titulo}</h2>{sub && <p className="secao-sub">{sub}</p>}</div>
        {link && <Link to={link} className="secao-link">{rotuloLink}</Link>}
      </div>
      {children}
    </Revelar>
  );
}
