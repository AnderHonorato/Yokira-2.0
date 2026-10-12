import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowBigUp } from 'lucide-react';
import { buscar, enviar } from '../util/api.js';
import { useSessao } from '../ganchos/useSessao.jsx';
import { useAvisos } from '../ganchos/useAvisos.jsx';
import Avatar, { SeloTier } from '../componentes/Avatar.jsx';
import { Carregando, Erro } from '../componentes/Estado.jsx';
import { tempoAtras } from './Comunidade.jsx';
import './Forum.css';

export default function Topico() {
  const { id } = useParams();
  const { usuario, abrirLogin } = useSessao();
  const avisar = useAvisos();
  const [t, setT] = useState(null);
  const [erro, setErro] = useState(null);
  const [resposta, setResposta] = useState('');
  useEffect(() => { buscar(`/forum/${id}`, { semCache: true }).then(setT).catch((e) => setErro(e.message)); }, [id]);
  if (erro) return <Erro mensagem={erro} />;
  if (!t) return <Carregando />;
  const votei = usuario && t.votantes.includes(usuario.id);

  const votar = async () => {
    if (!usuario) return abrirLogin();
    const r = await enviar(`/forum/${id}/votar`, {});
    setT({ ...t, votos: r.votos, votantes: r.votei ? [...t.votantes, usuario.id] : t.votantes.filter((v) => v !== usuario.id) });
  };
  const responder = async (e) => {
    e.preventDefault();
    try { const r = await enviar(`/forum/${id}/respostas`, { texto: resposta }); setT({ ...t, respostas: [...t.respostas, r] }); setResposta(''); avisar('Resposta publicada. +8 XP', 'xp'); }
    catch (err) { avisar(err.message, 'erro'); }
  };

  return (
    <div className="pagina casca topico">
      <Link to="/forum" className="secao-link">Voltar ao fórum</Link>
      <article className="caixa topico-post">
        <button className={`topico-voto ${votei ? 'votado' : ''}`} onClick={votar} aria-pressed={votei} aria-label="Votar no tópico"><ArrowBigUp size={22} fill={votei ? 'currentColor' : 'none'} /><span key={t.votos}>{t.votos}</span></button>
        <div>
          <span className="chip">{t.categoria}</span>
          <h1 className="topico-titulo">{t.titulo}</h1>
          <p className="topico-autor"><Avatar usuario={t.autor} tamanho={26} />{t.autor?.nome}<SeloTier tier={t.autor?.tier} /><small>{tempoAtras(t.em)}</small></p>
          <p className="topico-texto">{t.texto}</p>
        </div>
      </article>
      <h2 className="anime-h2">{t.respostas.length} {t.respostas.length === 1 ? 'resposta' : 'respostas'}</h2>
      <ul className="respostas">
        {t.respostas.map((r) => (
          <li key={r.id} className="resposta"><Avatar usuario={r.autor} tamanho={34} /><div><p className="topico-autor">{r.autor?.nome}<SeloTier tier={r.autor?.tier} /><small>{tempoAtras(r.em)}</small></p><p className="topico-texto">{r.texto}</p></div></li>
        ))}
      </ul>
      {usuario
        ? <form className="comentario-form" onSubmit={responder}><textarea value={resposta} onChange={(e) => setResposta(e.target.value)} rows={3} placeholder="Escreva sua resposta" aria-label="Resposta" /><button className="btn btn-primario" disabled={!resposta.trim()}>Responder</button></form>
        : <button className="btn btn-contorno" onClick={() => abrirLogin()}>Entre para responder</button>}
    </div>
  );
}
