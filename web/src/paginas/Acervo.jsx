import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { useApi } from '../ganchos/useApi.js';
import CartaoPoster from '../componentes/CartaoPoster.jsx';
import { Carregando, Erro } from '../componentes/Estado.jsx';
import { ROTULO_ORDEM, ROTULO_STATUS, ROTULO_TEMPORADA } from '../util/formatos.js';
import './Acervo.css';

const CAMPOS = ['q', 'genero', 'ano', 'temporada', 'formato', 'status', 'ordem', 'pagina'];

export default function Acervo() {
  const [params, setParams] = useSearchParams();
  const [texto, setTexto] = useState(params.get('q') ?? '');
  const filtros = useApi('/filtros');
  const consulta = new URLSearchParams(CAMPOS.filter((c) => params.get(c)).map((c) => [c, params.get(c)])).toString();
  const { dados, erro, carregando } = useApi(`/animes?${consulta}`);

  useEffect(() => { setTexto(params.get('q') ?? ''); }, [params]);

  // Muda um filtro e volta para a página 1
  const definir = (campo, valor) => {
    const novo = new URLSearchParams(params);
    if (valor) novo.set(campo, valor); else novo.delete(campo);
    if (campo !== 'pagina') novo.delete('pagina');
    setParams(novo);
  };
  const enviarBusca = (e) => { e.preventDefault(); definir('q', texto.trim()); };
  const temFiltro = CAMPOS.some((c) => c !== 'pagina' && params.get(c));
  const f = filtros.dados;

  const Seletor = ({ campo, rotulo, opcoes }) => (
    <label className={`pilula ${params.get(campo) ? 'pilula-ativa' : ''}`}>
      <span className="oculto-leitor">{rotulo}</span>
      <select value={params.get(campo) ?? ''} onChange={(e) => definir(campo, e.target.value)}>
        <option value="">{rotulo}</option>
        {opcoes.map(([valor, nome]) => <option key={valor} value={valor}>{nome}</option>)}
      </select>
    </label>
  );

  return (
    <div className="pagina">
      <section className="acervo-topo">
        <div className="casca">
          <h1 className="acervo-titulo">Encontre seu próximo anime</h1>
          <form className="acervo-busca" onSubmit={enviarBusca} role="search">
            <Search size={20} />
            <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Buscar pelo nome" aria-label="Buscar pelo nome" />
            <button className="btn btn-primario" type="submit">Buscar</button>
          </form>
          {f && (
            <div className="acervo-filtros">
              <Seletor campo="genero" rotulo="Gênero" opcoes={f.generos.map((g) => [g.slug, g.nome])} />
              <Seletor campo="ano" rotulo="Ano" opcoes={f.anos.map((a) => [a, a])} />
              <Seletor campo="temporada" rotulo="Temporada" opcoes={f.temporadas.map((t) => [t, ROTULO_TEMPORADA[t]])} />
              <Seletor campo="formato" rotulo="Formato" opcoes={f.formatos.map((x) => [x, x])} />
              <Seletor campo="status" rotulo="Status" opcoes={f.status.map((s) => [s, ROTULO_STATUS[s]])} />
              <Seletor campo="ordem" rotulo="Ordenar" opcoes={f.ordens.map((o) => [o, ROTULO_ORDEM[o]])} />
              {temFiltro && <button className="pilula pilula-limpar" onClick={() => setParams({})}><X size={14} />Limpar</button>}
            </div>
          )}
        </div>
      </section>

      <div className="casca">
        {carregando && <Carregando />}
        {erro && <Erro mensagem={erro} />}
        {dados && (
          <>
            <p className="acervo-total">{dados.total} {dados.total === 1 ? 'título encontrado' : 'títulos encontrados'}</p>
            {dados.itens.length === 0
              ? <div className="vazio">Nenhum anime combina com esses filtros. <button className="secao-link" onClick={() => setParams({})}>Limpar filtros</button></div>
              : <div className="grade-posters">{dados.itens.map((a) => <CartaoPoster key={a.slug} anime={a} />)}</div>}
            {dados.paginas > 1 && (
              <nav className="paginacao" aria-label="Páginas">
                {Array.from({ length: dados.paginas }, (_, i) => i + 1).map((n) => (
                  <button key={n} className={`btn ${n === dados.pagina ? 'btn-primario' : 'btn-contorno'}`} aria-current={n === dados.pagina ? 'page' : undefined} onClick={() => definir('pagina', String(n))}>{n}</button>
                ))}
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}
