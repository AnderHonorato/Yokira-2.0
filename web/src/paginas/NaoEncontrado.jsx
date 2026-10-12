import { Link } from 'react-router-dom';
export default function NaoEncontrado() {
  return (
    <div className="pagina casca vazio">
      <h1 className="pagina-titulo">Página não encontrada</h1>
      <p>O endereço pode ter mudado. Volte ao início ou procure no acervo.</p>
      <Link to="/acervo" className="btn btn-primario">Ir para o acervo</Link>
    </div>
  );
}
