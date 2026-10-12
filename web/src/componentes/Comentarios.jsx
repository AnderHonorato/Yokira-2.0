import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart } from 'lucide-react';
import { buscar, enviar } from '../util/api.js';
import { useSessao } from '../ganchos/useSessao.jsx';
import { useAvisos } from '../ganchos/useAvisos.jsx';
import Avatar, { SeloTier } from './Avatar.jsx';
import './Comentarios.css';

// Avaliações da comunidade: precisa estar logado para escrever e curtir
export default function Comentarios({ slug }) {
  const { usuario, abrirLogin, atualizar } = useSessao();
  const avisar = useAvisos();
  const [lista, setLista] = useState([]);
  const [form, setForm] = useState({ texto: '', nota: 0 });
  const [estado, setEstado] = useState({ enviando: false, erro: null });

  useEffect(() => { buscar(`/animes/${slug}/comentarios`, { semCache: true }).then(setLista).catch(() => {}); }, [slug]);

  const publicar = async (e) => {
    e.preventDefault();
    setEstado({ enviando: true, erro: null });
    try {
      const novo = await enviar(`/animes/${slug}/comentarios`, form);
      setLista((l) => [novo, ...l]);
      setForm({ texto: '', nota: 0 });
      setEstado({ enviando: false, erro: null });
      avisar('Avaliação publicada. +15 XP', 'xp');
      atualizar();
    } catch (err) { setEstado({ enviando: false, erro: err.message }); }
  };
  const curtir = async (c) => {
    if (!usuario) return abrirLogin();
    const r = await enviar(`/animes/${slug}/comentarios/${c.id}/curtir`, {});
    setLista((l) => l.map((x) => (x.id === c.id ? { ...x, curtidas: r.curti ? [...(x.curtidas ?? []), usuario.id] : (x.curtidas ?? []).filter((u) => u !== usuario.id) } : x)));
  };

  return (
    <section className="comentarios">
      <h2 className="anime-h2">Avaliações da comunidade</h2>
      {usuario ? (
        <form className="comentario-form" onSubmit={publicar}>
          <div className="comentario-quem"><Avatar usuario={usuario} tamanho={30} /><strong>{usuario.nome}</strong></div>
          <div className="estrelas" role="radiogroup" aria-label="Sua nota">
            {[2, 4, 6, 8, 10].map((n) => (
              <button type="button" key={n} role="radio" aria-checked={form.nota === n} aria-label={`${n / 2} estrelas`} onClick={() => setForm({ ...form, nota: n })} className={form.nota >= n ? 'acesa' : ''}>
                <Star size={22} fill={form.nota >= n ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>
          <textarea value={form.texto} onChange={(e) => setForm({ ...form, texto: e.target.value })} placeholder="O que você achou?" rows={3} maxLength={1000} aria-label="Sua avaliação" />
          {estado.erro && <p className="comentario-erro" role="alert">{estado.erro}</p>}
          <button className="btn btn-primario" disabled={estado.enviando}>{estado.enviando ? 'Publicando…' : 'Publicar avaliação'}</button>
        </form>
      ) : (
        <button className="comentario-convite" onClick={() => abrirLogin()}>Entre para avaliar e ganhar 15 XP</button>
      )}
      {lista.length === 0 && <p className="vazio">Ninguém avaliou este anime ainda. A primeira avaliação pode ser a sua.</p>}
      <ul className="comentario-lista">
        {lista.map((c) => {
          const curti = usuario && (c.curtidas ?? []).includes(usuario.id);
          return (
            <li key={c.id} className="comentario">
              {c.autor ? <Link to={`/perfil/${c.autor.id}`}><Avatar usuario={c.autor} tamanho={36} /></Link> : <span className="personagem-avatar">{c.nome[0]}</span>}
              <div>
                <p className="comentario-topo"><strong>{c.nome}</strong>{c.autor && <SeloTier tier={c.autor.tier} />}{c.nota && <span className="nota"><Star size={12} fill="currentColor" />{c.nota / 2}</span>}<small>{new Date(c.data).toLocaleDateString('pt-BR')}</small></p>
                <p className="comentario-texto">{c.texto}</p>
                <button className={`curtir ${curti ? 'curtido' : ''}`} onClick={() => curtir(c)} aria-pressed={Boolean(curti)}><Heart size={15} fill={curti ? 'currentColor' : 'none'} />{(c.curtidas ?? []).length || ''}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
