import { Link, useSearchParams } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useBiblioteca } from '../ganchos/useBiblioteca.jsx';
import { capa } from '../util/api.js';
import './MinhaLista.css';

const ABAS = [['lista', 'Minha lista'], ['favoritos', 'Favoritos'], ['historico', 'Continuar assistindo']];

export default function MinhaLista() {
  const [params, setParams] = useSearchParams();
  const aba = params.get('aba') ?? 'lista';
  const bib = useBiblioteca();
  const fontes = { lista: bib.lista, favoritos: bib.favoritos, historico: bib.progresso };
  const itens = Object.values(fontes[aba] ?? {}).sort((a, b) => b.em - a.em);
  const remover = (item) => (aba === 'favoritos' ? bib.alternarFavorito(item) : bib.alternarLista(item));

  return (
    <div className="pagina casca">
      <h1 className="pagina-titulo">Sua biblioteca</h1>
      <p className="secao-sub">Salvo neste navegador. Com login, isso passa a sincronizar entre aparelhos.</p>
      <div className="abas-simples" role="tablist">
        {ABAS.map(([id, rotulo]) => (
          <button key={id} role="tab" aria-selected={aba === id} onClick={() => setParams({ aba: id })}>
            {rotulo}<span>{Object.keys(fontes[id]).length}</span>
          </button>
        ))}
      </div>
      {itens.length === 0 ? (
        <div className="vazio">
          <p>{aba === 'historico' ? 'Você ainda não começou nenhum episódio.' : 'Nada salvo aqui ainda.'}</p>
          <Link to="/acervo" className="btn btn-primario">Explorar o acervo</Link>
        </div>
      ) : (
        <ul className="biblioteca">
          {itens.map((item) => (
            <li key={item.slug} className="biblioteca-item">
              <Link to={aba === 'historico' ? `/assistir/${item.slug}/${item.numero}` : `/anime/${item.slug}`}>
                <img src={capa(item.slug)} alt="" loading="lazy" />
                <strong>{item.titulo}</strong>
                {aba === 'historico' && <small>Parou no episódio {item.numero}</small>}
              </Link>
              {aba !== 'historico' && <button className="biblioteca-remover" onClick={() => remover(item)} aria-label={`Remover ${item.titulo}`}><Trash2 size={15} /></button>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
