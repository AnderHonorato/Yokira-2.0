import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Pencil, Zap } from 'lucide-react';
import { useApi } from '../ganchos/useApi.js';
import { useSessao } from '../ganchos/useSessao.jsx';
import { useAvisos } from '../ganchos/useAvisos.jsx';
import { enviar } from '../util/api.js';
import Avatar, { SeloTier } from '../componentes/Avatar.jsx';
import CartaoPoster from '../componentes/CartaoPoster.jsx';
import { Carregando, Erro } from '../componentes/Estado.jsx';
import { milhar } from '../util/formatos.js';
import { tempoAtras } from './Comunidade.jsx';
import './Perfil.css';

const CORES = ['#8b5cf6', '#38bdf8', '#f472b6', '#4ade80', '#f59e0b', '#fb7185', '#14b8a6', '#e879f9'];

export default function Perfil() {
  const { id } = useParams();
  const { dados: p, erro, carregando } = useApi(`/usuarios/${id}`);
  const { usuario, setUsuario } = useSessao();
  const avisar = useAvisos();
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState(null);
  const [aba, setAba] = useState('favoritos');
  if (carregando) return <Carregando />;
  if (erro) return <Erro mensagem={erro} />;
  const meu = usuario?.id === p.id;
  const exibido = meu ? { ...p, ...usuario } : p;
  const t = exibido.tier;

  const salvar = async (e) => {
    e.preventDefault();
    try { const novo = await enviar('/auth/perfil', form, 'PUT'); setUsuario(novo); setEditando(false); avisar('Perfil atualizado'); }
    catch (err) { avisar(err.message, 'erro'); }
  };

  return (
    <div className="pagina">
      <section className="perfil-capa" style={{ '--c': exibido.cor }}>
        <div className="casca perfil-topo">
          <Avatar usuario={exibido} tamanho={112} />
          <div className="perfil-info">
            <h1>{exibido.nome}{exibido.papel === 'admin' && <span className="selo-admin">admin</span>}</h1>
            <p className="perfil-bio">{exibido.bio || (meu ? 'Escreva algo sobre você.' : 'Sem bio por enquanto.')}</p>
            <div className="perfil-tier"><SeloTier tier={t} /><span>{milhar(exibido.xp)} XP</span>{t.proximo && <small>faltam {t.faltam} para {t.proximo}</small>}</div>
            <div className="barra-xp perfil-barra"><i style={{ width: `${t.progresso * 100}%`, background: t.cor }} /></div>
          </div>
          {meu && !editando && <button className="btn btn-contorno" onClick={() => { setForm({ nome: exibido.nome, bio: exibido.bio, cor: exibido.cor }); setEditando(true); }}><Pencil size={15} />Editar perfil</button>}
        </div>
      </section>

      <div className="casca">
        {editando && (
          <form className="caixa perfil-form" onSubmit={salvar}>
            <label>Nome<input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} maxLength={24} /></label>
            <label>Bio<textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} maxLength={160} rows={2} /></label>
            <div className="perfil-cores" role="radiogroup" aria-label="Cor do avatar">
              {CORES.map((c) => <button type="button" key={c} role="radio" aria-checked={form.cor === c} style={{ background: c }} onClick={() => setForm({ ...form, cor: c })} aria-label={c} />)}
            </div>
            <div className="perfil-form-acoes"><button className="btn btn-primario">Salvar</button><button type="button" className="btn btn-contorno" onClick={() => setEditando(false)}>Cancelar</button></div>
          </form>
        )}

        <dl className="perfil-numeros">
          <div><dt>Episódios assistidos</dt><dd>{p.assistidos}</dd></div>
          <div><dt>Na lista</dt><dd>{p.lista.length}</dd></div>
          <div><dt>Favoritos</dt><dd>{p.favoritos.length}</dd></div>
          <div><dt>Membro desde</dt><dd>{new Date(p.criadoEm).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</dd></div>
        </dl>

        <div className="abas-simples" role="tablist">
          {[['favoritos', 'Favoritos'], ['lista', 'Lista'], ['atividade', 'Atividade']].map(([k, r]) => <button key={k} role="tab" aria-selected={aba === k} onClick={() => setAba(k)}>{r}</button>)}
        </div>
        {aba !== 'atividade' && (p[aba].length
          ? <div className="grade-posters">{p[aba].map((a) => <CartaoPoster key={a.slug} anime={a} />)}</div>
          : <p className="vazio">Nada por aqui ainda.</p>)}
        {aba === 'atividade' && (
          <ul className="feed caixa">
            {p.atividades.length === 0 && <li>Sem atividade recente.</li>}
            {p.atividades.map((a) => <li key={a.id}><Zap size={16} /><p>{a.acao}<small>{tempoAtras(a.em)}</small></p>{a.pontos > 0 && <span className="feed-xp">+{a.pontos}</span>}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
}
