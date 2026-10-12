import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, X, Send, Hash, Search, Users } from 'lucide-react';
import { assinarChat, buscar, enviar, capa } from '../util/api.js';
import { useSessao } from '../ganchos/useSessao.jsx';
import { useAvisos } from '../ganchos/useAvisos.jsx';
import Avatar, { SeloTier } from './Avatar.jsx';
import './Chat.css';

const hora = (iso) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
function rotuloDia(iso) {
  const d = new Date(iso), hoje = new Date(), ontem = new Date(Date.now() - 864e5);
  if (d.toDateString() === hoje.toDateString()) return 'Hoje';
  if (d.toDateString() === ontem.toDateString()) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
}

// Chat flutuante: salas (geral + uma por anime), mensagens em tempo real e quem está online
export default function Chat() {
  const { usuario, abrirLogin } = useSessao();
  const avisar = useAvisos();
  const [aberto, setAberto] = useState(false);
  const [sala, setSala] = useState('geral');
  const [salas, setSalas] = useState(null);
  const [mensagens, setMensagens] = useState([]);
  const [online, setOnline] = useState({ total: 0, usuarios: [] });
  const [naoLidas, setNaoLidas] = useState(0);
  const [texto, setTexto] = useState('');
  const [filtro, setFiltro] = useState('');
  const [painelMobile, setPainelMobile] = useState('mensagens');
  const fim = useRef(null);
  const salaRef = useRef(sala); salaRef.current = sala;
  const abertoRef = useRef(aberto); abertoRef.current = aberto;

  // Conexão em tempo real (reconecta quando a conta muda)
  useEffect(() => assinarChat((tipo, dados) => {
    if (tipo === 'online') setOnline(dados);
    if (tipo === 'mensagem') {
      if (dados.sala === salaRef.current) setMensagens((l) => (l.some((m) => m.id === dados.id) ? l : [...l, dados]));
      if (!abertoRef.current) setNaoLidas((n) => n + 1);
      setSalas(null);
    }
  }), [usuario?.id]);

  useEffect(() => { if (aberto && !salas) buscar('/chat/salas', { semCache: true }).then(setSalas).catch(() => {}); }, [aberto, salas]);
  useEffect(() => { if (aberto) buscar(`/chat/${sala}/mensagens`, { semCache: true }).then(setMensagens).catch(() => setMensagens([])); }, [aberto, sala]);
  useEffect(() => { if (aberto) { setNaoLidas(0); fim.current?.scrollIntoView({ block: 'end' }); } }, [mensagens, aberto]);
  useEffect(() => {
    if (!aberto) return;
    const esc = (e) => e.key === 'Escape' && setAberto(false);
    addEventListener('keydown', esc);
    return () => removeEventListener('keydown', esc);
  }, [aberto]);

  const mandar = async (e) => {
    e.preventDefault();
    const t = texto.trim();
    if (!t) return;
    setTexto('');
    try {
      const msg = await enviar(`/chat/${sala}`, { texto: t });
      setMensagens((l) => (l.some((m) => m.id === msg.id) ? l : [...l, msg]));
    } catch (err) { avisar(err.message, 'erro'); setTexto(t); }
  };

  // Agrupa mensagens seguidas do mesmo autor e insere separadores de dia
  const blocos = useMemo(() => {
    const saida = [];
    let dia = '', anterior = null;
    for (const m of mensagens) {
      const d = rotuloDia(m.em);
      if (d !== dia) { saida.push({ tipo: 'dia', id: `d${m.id}`, rotulo: d }); dia = d; anterior = null; }
      const junta = anterior && anterior.autor.id === m.autor.id && new Date(m.em) - new Date(anterior.em) < 5 * 60000;
      saida.push({ tipo: 'msg', ...m, continua: junta });
      anterior = m;
    }
    return saida;
  }, [mensagens]);

  const tituloSala = sala === 'geral' ? 'Chat geral' : [...(salas?.ativas ?? []), ...(salas?.emAlta ?? [])].find((s) => s.slug === sala)?.titulo ?? sala;
  const listaSalas = [salas?.geral, ...(salas?.ativas ?? []), ...(salas?.emAlta ?? [])].filter(Boolean)
    .filter((s) => s.titulo.toLowerCase().includes(filtro.toLowerCase()));
  const trocarSala = (slug) => { setSala(slug); setPainelMobile('mensagens'); };

  return (
    <>
      <button className={`chat-fab ${aberto ? 'escondido' : ''}`} onClick={() => setAberto(true)} aria-label={`Abrir chat, ${online.total} online`}>
        <MessageCircle size={22} />
        <span className="chat-fab-online">{online.total}</span>
        {naoLidas > 0 && <span className="chat-fab-novas">{naoLidas > 9 ? '9+' : naoLidas}</span>}
      </button>

      {aberto && (
        <div className="chat-fundo" onMouseDown={() => setAberto(false)}>
          <section className={`chat painel-${painelMobile}`} role="dialog" aria-label="Chat da comunidade" onMouseDown={(e) => e.stopPropagation()}>
            <aside className="chat-salas">
              <label className="chat-busca"><Search size={15} /><input value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Buscar sala de anime" /></label>
              <div className="chat-salas-lista">
                {listaSalas.map((s, i) => (
                  <div key={s.slug}>
                    {i === 1 && salas.ativas.length > 0 && !filtro && <p className="chat-rotulo">Conversas ativas</p>}
                    {s.slug === salas.emAlta[0]?.slug && !filtro && <p className="chat-rotulo">Em alta para conversar</p>}
                    <button className="chat-sala" aria-current={s.slug === sala} onClick={() => trocarSala(s.slug)}>
                      {s.slug === 'geral' ? <span className="chat-sala-icone"><Hash size={18} /></span> : <img src={capa(s.slug)} alt="" />}
                      <span><strong>{s.titulo}</strong><small>{s.ultima ? `${s.ultima.nome}: ${s.ultima.texto}` : 'Comece a conversa'}</small></span>
                    </button>
                  </div>
                ))}
              </div>
              {!usuario && <button className="chat-entrar" onClick={() => abrirLogin()}>Entrar para conversar</button>}
            </aside>

            <div className="chat-meio">
              <header className="chat-cabeca">
                <button className="chat-voltar" onClick={() => setPainelMobile('salas')} aria-label="Ver salas"><Hash size={18} /></button>
                <div><h2>{tituloSala}</h2><small><i className="chat-ponto" />{online.total} online</small></div>
                <button className="chat-voltar" onClick={() => setPainelMobile('online')} aria-label="Ver quem está online"><Users size={18} /></button>
                <button className="btn btn-icone" onClick={() => setAberto(false)} aria-label="Fechar chat"><X size={18} /></button>
              </header>
              <div className="chat-mensagens">
                {blocos.length === 0 && <p className="vazio">Nenhuma mensagem aqui ainda. Que tal puxar o assunto?</p>}
                {blocos.map((b) => (b.tipo === 'dia'
                  ? <p key={b.id} className="chat-dia"><span>{b.rotulo}</span></p>
                  : (
                    <div key={b.id} className={`chat-msg ${b.continua ? 'continua' : ''} ${b.autor.id === usuario?.id ? 'minha' : ''}`}>
                      {!b.continua && <Link to={`/perfil/${b.autor.id}`} onClick={() => setAberto(false)}><Avatar usuario={b.autor} tamanho={34} anel={false} /></Link>}
                      <div>
                        {!b.continua && <p className="chat-autor"><strong style={{ color: b.autor.cor }}>{b.autor.nome}</strong>{b.autor.papel === 'admin' && <span className="selo-admin">admin</span>}<time>{hora(b.em)}</time></p>}
                        <p className="chat-texto">{b.texto}</p>
                      </div>
                    </div>
                  )))}
                <div ref={fim} />
              </div>
              {usuario ? (
                <form className="chat-enviar" onSubmit={mandar}>
                  <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={`Mensagem em ${tituloSala}`} maxLength={500} aria-label="Mensagem" />
                  <button className="btn btn-primario btn-icone" disabled={!texto.trim()} aria-label="Enviar"><Send size={17} /></button>
                </form>
              ) : (
                <button className="chat-convite" onClick={() => abrirLogin()}>Entre com sua conta para participar da conversa.</button>
              )}
            </div>

            <aside className="chat-online">
              <button className="chat-voltar chat-voltar-texto" onClick={() => setPainelMobile('mensagens')}>Voltar para a conversa</button>
              <p className="chat-rotulo">Online agora · {online.usuarios.length}</p>
              {online.usuarios.length === 0 && <p className="chat-vazio">Ninguém logado no momento.</p>}
              {online.usuarios.map((u) => (
                <Link key={u.id} to={`/perfil/${u.id}`} className="chat-pessoa" onClick={() => setAberto(false)}>
                  <Avatar usuario={u} tamanho={34} online />
                  <span><strong>{u.nome}</strong><SeloTier tier={u.tier} /></span>
                </Link>
              ))}
            </aside>
          </section>
        </div>
      )}
    </>
  );
}
