import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, CalendarDays, Trophy, Newspaper, Bookmark, Search, Menu, X, Sun, Moon, Users, ChevronDown, MessagesSquare, Vote, Medal } from 'lucide-react';
import { useSessao } from '../ganchos/useSessao.jsx';
import MenuUsuario from './MenuUsuario.jsx';
import { useTema } from '../ganchos/useTema.js';
import BuscaRapida from './BuscaRapida.jsx';
import './Topo.css';

const LINKS = [
  { para: '/', rotulo: 'Início', Icone: Home, fim: true },
  { para: '/acervo', rotulo: 'Acervo', Icone: LayoutGrid },
  { para: '/agenda', rotulo: 'Agenda', Icone: CalendarDays },
  { para: '/top100', rotulo: 'Top 100', Icone: Trophy },
  { para: '/noticias', rotulo: 'Notícias', Icone: Newspaper },
  { para: '/forum', rotulo: 'Fórum', Icone: MessagesSquare },
];
const COMUNIDADE = [
  { para: '/comunidade', rotulo: 'Comunidade', texto: 'Atividade ao vivo e hall da fama', Icone: Users },
  { para: '/ranking', rotulo: 'Ranking', texto: 'Veja sua posição por XP', Icone: Medal },
  { para: '/anime-da-semana', rotulo: 'Anime da semana', texto: 'Vote no melhor da temporada', Icone: Vote },
  { para: '/minha-lista', rotulo: 'Minha lista', texto: 'Salvos, favoritos e histórico', Icone: Bookmark },
];

export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="Yōkira, página inicial">
      <span className="logo-marca" aria-hidden="true">Y</span>
      <span className="logo-nome">Yōkira</span>
    </Link>
  );
}

export default function Topo() {
  const [tema, alternarTema] = useTema();
  const { usuario, abrirLogin } = useSessao();
  const [comunidadeAberta, setComunidadeAberta] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const [buscaAberta, setBuscaAberta] = useState(false);
  const local = useLocation();

  useEffect(() => { setMenuAberto(false); setBuscaAberta(false); setComunidadeAberta(false); }, [local.pathname]);
  useEffect(() => {
    const atalho = (e) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) { e.preventDefault(); setBuscaAberta(true); }
    };
    addEventListener('keydown', atalho);
    return () => removeEventListener('keydown', atalho);
  }, []);

  return (
    <>
    <header className="topo">
      <div className="casca topo-linha">
        <Logo />
        <nav className="topo-nav" aria-label="Principal">
          {LINKS.map(({ para, rotulo, Icone, fim }) => (
            <NavLink key={para} to={para} end={fim} className="topo-link"><Icone size={16} />{rotulo}</NavLink>
          ))}
          <div className="topo-suspenso" onMouseEnter={() => setComunidadeAberta(true)} onMouseLeave={() => setComunidadeAberta(false)}>
            <button className="topo-link" aria-expanded={comunidadeAberta} onClick={() => setComunidadeAberta((v) => !v)}><Users size={16} />Comunidade<ChevronDown size={14} /></button>
            {comunidadeAberta && (
              <div className="topo-menu">
                {COMUNIDADE.map(({ para, rotulo, texto, Icone }) => (
                  <NavLink key={para} to={para} className="topo-menu-item"><span className="atalho-icone"><Icone size={17} /></span><span><strong>{rotulo}</strong><small>{texto}</small></span></NavLink>
                ))}
              </div>
            )}
          </div>
        </nav>
        <div className="topo-acoes">
          <button className="btn btn-contorno btn-icone" onClick={() => setBuscaAberta(true)} aria-label="Buscar (atalho /)"><Search size={18} /></button>
          <button className="btn btn-contorno btn-icone" onClick={alternarTema} aria-label={tema === 'claro' ? 'Usar tema escuro' : 'Usar tema claro'}>
            {tema === 'claro' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          {usuario ? <MenuUsuario /> : <button className="btn btn-primario topo-entrar" onClick={() => abrirLogin()}>Entrar</button>}
          <button className="btn btn-contorno btn-icone topo-menu-btn" onClick={() => setMenuAberto(true)} aria-label="Abrir menu"><Menu size={18} /></button>
        </div>
      </div>

      {buscaAberta && <BuscaRapida aoFechar={() => setBuscaAberta(false)} />}
    </header>
    {menuAberto && createPortal(
      <div className="gaveta-fundo" onClick={() => setMenuAberto(false)}>
        <nav className="gaveta" aria-label="Menu" onClick={(e) => e.stopPropagation()}>
          <div className="gaveta-topo"><Logo /><button className="btn btn-icone" onClick={() => setMenuAberto(false)} aria-label="Fechar menu"><X size={20} /></button></div>
          {[...LINKS, ...COMUNIDADE].map(({ para, rotulo, Icone, fim }) => (
            <NavLink key={para} to={para} end={fim} className="gaveta-link"><Icone size={18} />{rotulo}</NavLink>
          ))}
          {!usuario && <button className="btn btn-primario gaveta-entrar" onClick={() => { setMenuAberto(false); abrirLogin(); }}>Entrar ou criar conta</button>}
          <button className="gaveta-link" onClick={alternarTema}>{tema === 'claro' ? <Moon size={18} /> : <Sun size={18} />}Tema {tema === 'claro' ? 'escuro' : 'claro'}</button>
        </nav>
      </div>,
      document.body
    )}
    </>
  );
}
