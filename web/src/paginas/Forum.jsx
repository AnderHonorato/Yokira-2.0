import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MessageSquare, ArrowBigUp, Pin, Plus, Search } from 'lucide-react';
import { useApi } from '../ganchos/useApi.js';
import { useSessao } from '../ganchos/useSessao.jsx';
import { useAvisos } from '../ganchos/useAvisos.jsx';
import { enviar } from '../util/api.js';
import Avatar from '../componentes/Avatar.jsx';
import { Carregando, Erro } from '../componentes/Estado.jsx';
import { tempoAtras } from './Comunidade.jsx';
import './Forum.css';

const ORDENS = [['recentes', 'Recentes'], ['em-alta', 'Em alta'], ['sem-resposta', 'Sem resposta'], ['votados', 'Mais votados']];

export default function Forum() {
  const [params, setParams] = useSearchParams();
  const navegar = useNavigate();
  const { usuario, abrirLogin } = useSessao();
  const avisar = useAvisos();
  const [novo, setNovo] = useState(null);
  const [busca, setBusca] = useState(params.get('q') ?? '');
  const { dados, erro, carregando } = useApi(`/forum?${params.toString()}`);
  const definir = (k, v) => { const p = new URLSearchParams(params); v ? p.set(k, v) : p.delete(k); setParams(p); };

  const publicar = async (e) => {
    e.preventDefault();
    try { const { id } = await enviar('/forum', novo); avisar('Tópico publicado. +20 XP', 'xp'); navegar(`/forum/${id}`); }
    catch (err) { avisar(err.message, 'erro'); }
  };

  return (
    <div className="pagina casca">
      <div className="forum-topo">
        <div><h1 className="pagina-titulo">Fórum</h1><p className="secao-sub">Onde a comunidade discute teorias, recomendações e episódios.</p></div>
        <button className="btn btn-primario" onClick={() => (usuario ? setNovo({ titulo: '', texto: '', categoria: 'Geral' }) : abrirLogin())}><Plus size={16} />Novo tópico</button>
      </div>

      {novo && (
        <form className="caixa forum-novo" onSubmit={publicar}>
          <input value={novo.titulo} onChange={(e) => setNovo({ ...novo, titulo: e.target.value })} placeholder="Título do tópico" maxLength={120} aria-label="Título" required />
          <select value={novo.categoria} onChange={(e) => setNovo({ ...novo, categoria: e.target.value })} aria-label="Categoria">{dados?.categorias.map((c) => <option key={c}>{c}</option>)}</select>
          <textarea value={novo.texto} onChange={(e) => setNovo({ ...novo, texto: e.target.value })} placeholder="Escreva sua ideia, pergunta ou teoria" rows={5} aria-label="Texto" required />
          <div className="perfil-form-acoes"><button className="btn btn-primario">Publicar</button><button type="button" className="btn btn-contorno" onClick={() => setNovo(null)}>Cancelar</button></div>
        </form>
      )}

      <div className="forum-grade">
        <aside className="forum-lateral">
          <form className="forum-busca" onSubmit={(e) => { e.preventDefault(); definir('q', busca.trim()); }}><Search size={15} /><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar tópicos" aria-label="Buscar tópicos" /></form>
          <p className="chat-rotulo">Categorias</p>
          <button className="forum-cat" aria-current={!params.get('categoria')} onClick={() => definir('categoria', '')}>Todas</button>
          {dados?.categorias.map((c) => <button key={c} className="forum-cat" aria-current={params.get('categoria') === c} onClick={() => definir('categoria', c)}>{c}</button>)}
        </aside>
        <div>
          <div className="abas-simples forum-ordens">
            {ORDENS.map(([k, r]) => <button key={k} aria-selected={(params.get('ordem') ?? 'recentes') === k} onClick={() => definir('ordem', k)}>{r}</button>)}
          </div>
          {carregando && <Carregando />}
          {erro && <Erro mensagem={erro} />}
          {dados?.itens.length === 0 && <p className="vazio">Nenhum tópico aqui. Que tal abrir o primeiro?</p>}
          <ul className="topicos">
            {dados?.itens.map((t, i) => (
              <li key={t.id} style={{ animationDelay: `${i * 35}ms` }}>
                <Link to={`/forum/${t.id}`} className={`topico-linha ${t.fixado ? 'fixado' : ''}`}>
                  <span className="topico-votos"><ArrowBigUp size={18} />{t.votos}</span>
                  <span className="topico-corpo">
                    <span className="topico-tags">{t.fixado && <span className="chip"><Pin size={11} />Fixado</span>}<span className="chip">{t.categoria}</span></span>
                    <strong>{t.titulo}</strong>
                    <small><Avatar usuario={t.autor} tamanho={18} anel={false} />{t.autor?.nome} · {tempoAtras(t.em)}</small>
                  </span>
                  <span className="topico-resp"><MessageSquare size={16} />{t.respostas}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
