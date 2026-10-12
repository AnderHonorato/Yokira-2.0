import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { buscar, enviar } from '../util/api.js';
import './Comentarios.css';

// Avaliações da comunidade: lista e formulário (POST /api/animes/:slug/comentarios)
export default function Comentarios({ slug }) {
  const [lista, setLista] = useState([]);
  const [form, setForm] = useState({ nome: '', texto: '', nota: 0 });
  const [estado, setEstado] = useState({ enviando: false, erro: null });

  useEffect(() => { buscar(`/animes/${slug}/comentarios`, { semCache: true }).then(setLista).catch(() => {}); }, [slug]);

  const publicar = async (e) => {
    e.preventDefault();
    setEstado({ enviando: true, erro: null });
    try {
      const novo = await enviar(`/animes/${slug}/comentarios`, form);
      setLista((l) => [novo, ...l]);
      setForm({ nome: form.nome, texto: '', nota: 0 });
      setEstado({ enviando: false, erro: null });
    } catch (err) { setEstado({ enviando: false, erro: err.message }); }
  };

  return (
    <section className="comentarios">
      <h2 className="anime-h2">Avaliações da comunidade</h2>
      <form className="comentario-form" onSubmit={publicar}>
        <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Seu nome" maxLength={40} aria-label="Seu nome" />
        <div className="estrelas" role="radiogroup" aria-label="Sua nota">
          {[2, 4, 6, 8, 10].map((n) => (
            <button type="button" key={n} role="radio" aria-checked={form.nota === n} aria-label={`${n / 2} estrelas`} onClick={() => setForm({ ...form, nota: n })}>
              <Star size={20} fill={form.nota >= n ? 'currentColor' : 'none'} />
            </button>
          ))}
        </div>
        <textarea value={form.texto} onChange={(e) => setForm({ ...form, texto: e.target.value })} placeholder="O que você achou?" rows={3} maxLength={1000} aria-label="Sua avaliação" />
        {estado.erro && <p className="comentario-erro" role="alert">{estado.erro}</p>}
        <button className="btn btn-primario" disabled={estado.enviando}>{estado.enviando ? 'Publicando…' : 'Publicar avaliação'}</button>
      </form>
      {lista.length === 0 && <p className="vazio">Ninguém avaliou este anime ainda. A primeira avaliação pode ser a sua.</p>}
      <ul className="comentario-lista">
        {lista.map((c) => (
          <li key={c.id} className="comentario">
            <span className="personagem-avatar" aria-hidden="true">{c.nome[0].toUpperCase()}</span>
            <div>
              <p className="comentario-topo"><strong>{c.nome}</strong>{c.nota && <span className="nota"><Star size={12} fill="currentColor" />{c.nota / 2}</span>}<small>{new Date(c.data).toLocaleDateString('pt-BR')}</small></p>
              <p className="comentario-texto">{c.texto}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
