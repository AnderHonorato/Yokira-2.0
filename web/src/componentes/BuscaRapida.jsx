import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { buscar, capa } from '../util/api.js';
import './BuscaRapida.css';

// Busca em sobreposição com sugestões enquanto digita
export default function BuscaRapida({ aoFechar }) {
  const [termo, setTermo] = useState('');
  const [resultados, setResultados] = useState([]);
  const campo = useRef(null);
  const navegar = useNavigate();

  useEffect(() => {
    campo.current?.focus();
    const esc = (e) => e.key === 'Escape' && aoFechar();
    addEventListener('keydown', esc);
    return () => removeEventListener('keydown', esc);
  }, [aoFechar]);

  useEffect(() => {
    if (termo.trim().length < 2) { setResultados([]); return; }
    const espera = setTimeout(() => {
      buscar(`/animes?q=${encodeURIComponent(termo.trim())}&limite=6`).then((r) => setResultados(r.itens)).catch(() => {});
    }, 200);
    return () => clearTimeout(espera);
  }, [termo]);

  const enviar = (e) => {
    e.preventDefault();
    if (termo.trim()) navegar(`/acervo?q=${encodeURIComponent(termo.trim())}`);
  };

  return (
    <div className="busca-fundo" onClick={aoFechar}>
      <div className="busca-caixa" role="dialog" aria-label="Buscar anime" onClick={(e) => e.stopPropagation()}>
        <form className="busca-form" onSubmit={enviar}>
          <Search size={20} />
          <input ref={campo} value={termo} onChange={(e) => setTermo(e.target.value)} placeholder="Buscar anime pelo nome" aria-label="Nome do anime" />
          <button type="button" className="btn btn-icone" onClick={aoFechar} aria-label="Fechar busca"><X size={18} /></button>
        </form>
        {resultados.length > 0 && (
          <ul className="busca-lista">
            {resultados.map((a) => (
              <li key={a.slug}>
                <Link to={`/anime/${a.slug}`} className="busca-item">
                  <img src={capa(a.slug)} alt="" width="40" height="60" />
                  <span><strong>{a.titulo}</strong><small>{a.formato} · {a.ano} · {a.generos.slice(0, 2).join(', ')}</small></span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {termo.trim().length >= 2 && resultados.length === 0 && <p className="busca-vazio">Nenhum título com esse nome. Tente outra palavra.</p>}
      </div>
    </div>
  );
}
