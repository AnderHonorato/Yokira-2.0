import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Upload, Image, Film, Sparkles, Save } from 'lucide-react';
import { buscar, enviar, capa } from '../util/api.js';
import { useSessao } from '../ganchos/useSessao.jsx';
import { useAvisos } from '../ganchos/useAvisos.jsx';
import Avatar from '../componentes/Avatar.jsx';
import Particulas from '../componentes/Particulas.jsx';
import { Carregando } from '../componentes/Estado.jsx';
import { ROTULO_STATUS, milhar } from '../util/formatos.js';
import './Admin.css';

const ABAS = [['aparencia', 'Aparência'], ['animes', 'Animes'], ['usuarios', 'Usuários']];
const lerArquivo = (arquivo) => new Promise((ok, falha) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = falha; r.readAsDataURL(arquivo); });

function Aparencia() {
  const avisar = useAvisos();
  const [ap, setAp] = useState(null);
  const [animes, setAnimes] = useState([]);
  const [enviando, setEnviando] = useState(false);
  useEffect(() => { buscar('/aparencia', { semCache: true }).then(setAp); buscar('/admin/animes', { semCache: true }).then(setAnimes); }, []);
  if (!ap) return <Carregando />;

  const subir = async (e) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    if (arquivo.size > 12 * 1024 * 1024) return avisar('Arquivo acima de 12 MB. Use uma URL externa ou comprima.', 'erro');
    setEnviando(true);
    try {
      const { url, tipo } = await enviar('/admin/upload', { nome: arquivo.name, dataUrl: await lerArquivo(arquivo) });
      setAp({ ...ap, heroUrl: url, heroTipo: tipo });
      avisar('Arquivo enviado. Clique em salvar para publicar.');
    } catch (err) { avisar(err.message, 'erro'); }
    setEnviando(false);
  };
  const salvar = async () => {
    try { setAp(await enviar('/admin/aparencia', ap, 'PUT')); avisar('Aparência publicada'); } catch (err) { avisar(err.message, 'erro'); }
  };
  const alternarDestaque = (slug) => setAp({ ...ap, destaques: ap.destaques.includes(slug) ? ap.destaques.filter((s) => s !== slug) : [...ap.destaques, slug].slice(0, 8) });

  return (
    <div className="admin-aparencia">
      <div className="caixa admin-previa" style={{ '--escurecer': ap.heroEscurecer / 100 }}>
        {ap.heroTipo === 'video' && ap.heroUrl && <video src={ap.heroUrl} autoPlay muted loop playsInline />}
        {ap.heroTipo === 'imagem' && ap.heroUrl && <img src={ap.heroUrl} alt="" className="hero-kenburns" />}
        {(ap.heroTipo === 'gradiente' || !ap.heroUrl) && <div className="hero-aurora"><span /><span /><span /></div>}
        <div className="admin-previa-veu" />
        {ap.particulas && <Particulas quantidade={30} />}
        <p>Prévia do fundo do destaque</p>
      </div>

      <div className="caixa admin-form">
        <h2 className="caixa-titulo">Fundo da tela principal</h2>
        <div className="admin-tipos" role="radiogroup" aria-label="Tipo de fundo">
          {[['gradiente', 'Gradiente animado', Sparkles], ['imagem', 'Imagem ou GIF', Image], ['video', 'Vídeo em loop', Film]].map(([v, r, Icone]) => (
            <button key={v} role="radio" aria-checked={ap.heroTipo === v} onClick={() => setAp({ ...ap, heroTipo: v })}><Icone size={18} />{r}</button>
          ))}
        </div>
        {ap.heroTipo !== 'gradiente' && (
          <>
            <label>URL do arquivo<input value={ap.heroUrl} onChange={(e) => setAp({ ...ap, heroUrl: e.target.value })} placeholder="https://... ou envie abaixo" /></label>
            <label className="admin-upload"><Upload size={17} />{enviando ? 'Enviando…' : 'Enviar do computador (JPG, PNG, WEBP, GIF, MP4, WEBM até 12 MB)'}
              <input type="file" accept="image/*,video/mp4,video/webm" onChange={subir} disabled={enviando} /></label>
          </>
        )}
        <label>Escurecer o fundo: {ap.heroEscurecer}%<input type="range" min="0" max="90" value={ap.heroEscurecer} onChange={(e) => setAp({ ...ap, heroEscurecer: Number(e.target.value) })} /></label>
        <label className="admin-check"><input type="checkbox" checked={ap.particulas} onChange={(e) => setAp({ ...ap, particulas: e.target.checked })} />Partículas animadas</label>
        <h2 className="caixa-titulo">Títulos no destaque ({ap.destaques.length}/8)</h2>
        <p className="secao-sub">Sem seleção, entram os 5 em alta.</p>
        <div className="admin-destaques">
          {animes.map((a) => (
            <button key={a.slug} aria-pressed={ap.destaques.includes(a.slug)} onClick={() => alternarDestaque(a.slug)}>
              <img src={capa(a.slug)} alt="" loading="lazy" /><span>{a.titulo}</span>
            </button>
          ))}
        </div>
        <button className="btn btn-primario" onClick={salvar}><Save size={16} />Salvar e publicar</button>
      </div>
    </div>
  );
}

function Animes() {
  const avisar = useAvisos();
  const [lista, setLista] = useState(null);
  const [filtro, setFiltro] = useState('');
  const [editando, setEditando] = useState(null);
  useEffect(() => { buscar('/admin/animes', { semCache: true }).then(setLista); }, []);
  if (!lista) return <Carregando />;
  const abrir = async (slug) => setEditando(await buscar(`/animes/${slug}`, { semCache: true }));
  const salvar = async (e) => {
    e.preventDefault();
    try {
      const a = await enviar(`/admin/animes/${editando.slug}`, editando, 'PUT');
      setLista(lista.map((x) => (x.slug === a.slug ? { ...x, titulo: a.titulo, status: a.status } : x)));
      setEditando(null); avisar('Anime atualizado');
    } catch (err) { avisar(err.message, 'erro'); }
  };
  const mudarEp = (numero, campo, valor) => setEditando({ ...editando, episodios: editando.episodios.map((ep) => (ep.numero === numero ? { ...ep, [campo]: valor } : ep)) });

  return (
    <div>
      <input className="admin-filtro" value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Filtrar por nome" aria-label="Filtrar animes" />
      <table className="admin-tabela">
        <thead><tr><th>Título</th><th>Status</th><th>Episódios</th><th /></tr></thead>
        <tbody>
          {lista.filter((a) => a.titulo.toLowerCase().includes(filtro.toLowerCase())).map((a) => (
            <tr key={a.slug}><td><img src={capa(a.slug)} alt="" />{a.titulo}</td><td>{ROTULO_STATUS[a.status]}</td><td>{a.episodiosDisponiveis}/{a.totalEpisodios}</td>
              <td><button className="btn btn-contorno" onClick={() => abrir(a.slug)}>Editar</button></td></tr>
          ))}
        </tbody>
      </table>
      {editando && (
        <div className="modal-fundo" onMouseDown={() => setEditando(null)}>
          <form className="modal-entrar admin-editor" onSubmit={salvar} onMouseDown={(e) => e.stopPropagation()}>
            <h2>Editar {editando.titulo}</h2>
            <label>Título<input value={editando.titulo} onChange={(e) => setEditando({ ...editando, titulo: e.target.value })} /></label>
            <label>Sinopse<textarea rows={4} value={editando.sinopse} onChange={(e) => setEditando({ ...editando, sinopse: e.target.value })} /></label>
            <label>Status<select value={editando.status} onChange={(e) => setEditando({ ...editando, status: e.target.value })}>{Object.entries(ROTULO_STATUS).map(([k, r]) => <option key={k} value={k}>{r}</option>)}</select></label>
            <h3>Episódios e vídeos</h3>
            <div className="admin-eps">
              {editando.episodios.map((ep) => (
                <div key={ep.numero} className="admin-ep">
                  <span>{ep.numero}</span>
                  <input value={ep.titulo} onChange={(e) => mudarEp(ep.numero, 'titulo', e.target.value)} aria-label={`Título do episódio ${ep.numero}`} />
                  <input value={ep.urlVideo} onChange={(e) => mudarEp(ep.numero, 'urlVideo', e.target.value)} placeholder="URL do vídeo (.mp4, .webm)" aria-label={`Vídeo do episódio ${ep.numero}`} />
                  <label className="admin-check"><input type="checkbox" checked={ep.disponivel} onChange={(e) => mudarEp(ep.numero, 'disponivel', e.target.checked)} />No ar</label>
                </div>
              ))}
            </div>
            <div className="perfil-form-acoes"><button className="btn btn-primario">Salvar</button><button type="button" className="btn btn-contorno" onClick={() => setEditando(null)}>Cancelar</button></div>
          </form>
        </div>
      )}
    </div>
  );
}

function Usuarios() {
  const avisar = useAvisos();
  const { usuario } = useSessao();
  const [lista, setLista] = useState(null);
  useEffect(() => { buscar('/admin/usuarios', { semCache: true }).then(setLista); }, []);
  if (!lista) return <Carregando />;
  const mudarPapel = async (u) => {
    const papel = u.papel === 'admin' ? 'membro' : 'admin';
    try { await enviar(`/admin/usuarios/${u.id}`, { papel }, 'PUT'); setLista(lista.map((x) => (x.id === u.id ? { ...x, papel } : x))); avisar(`${u.nome} agora é ${papel}`); }
    catch (err) { avisar(err.message, 'erro'); }
  };
  return (
    <table className="admin-tabela">
      <thead><tr><th>Pessoa</th><th>E-mail</th><th>XP</th><th>Papel</th></tr></thead>
      <tbody>
        {lista.map((u) => (
          <tr key={u.id}><td><Link to={`/perfil/${u.id}`}><Avatar usuario={u} tamanho={28} />{u.nome}</Link></td><td>{u.email.endsWith('.invalid') ? 'exemplo' : u.email}</td><td>{milhar(u.xp)}</td>
            <td><button className="btn btn-contorno" disabled={u.id === usuario.id} onClick={() => mudarPapel(u)}>{u.papel === 'admin' ? 'Admin · remover' : 'Tornar admin'}</button></td></tr>
        ))}
      </tbody>
    </table>
  );
}

export default function Admin() {
  const { usuario, ehAdmin, verificando, abrirLogin } = useSessao();
  const [aba, setAba] = useState('aparencia');
  const [resumo, setResumo] = useState(null);
  useEffect(() => { if (ehAdmin) buscar('/admin/resumo', { semCache: true }).then(setResumo).catch(() => {}); }, [ehAdmin]);
  if (verificando) return <Carregando />;
  if (!ehAdmin) {
    return (
      <div className="pagina casca vazio">
        <h1 className="pagina-titulo">Painel admin</h1>
        <p>{usuario ? 'Sua conta não tem acesso de administrador.' : 'Entre com uma conta de administrador. A primeira conta criada no site vira admin.'}</p>
        {!usuario && <button className="btn btn-primario" onClick={() => abrirLogin()}>Entrar</button>}
      </div>
    );
  }
  return (
    <div className="pagina casca">
      <h1 className="pagina-titulo">Painel admin</h1>
      {resumo && (
        <dl className="perfil-numeros admin-numeros">
          <div><dt>Animes</dt><dd>{resumo.animes}</dd></div><div><dt>No ar</dt><dd>{resumo.noAr}</dd></div>
          <div><dt>Episódios</dt><dd>{resumo.episodios}</dd></div><div><dt>Contas</dt><dd>{resumo.usuarios}</dd></div>
          <div><dt>Ações nas últimas 24h</dt><dd>{resumo.atividades24h}</dd></div>
        </dl>
      )}
      <div className="abas-simples" role="tablist">{ABAS.map(([k, r]) => <button key={k} role="tab" aria-selected={aba === k} onClick={() => setAba(k)}>{r}</button>)}</div>
      {aba === 'aparencia' && <Aparencia />}
      {aba === 'animes' && <Animes />}
      {aba === 'usuarios' && <Usuarios />}
    </div>
  );
}
