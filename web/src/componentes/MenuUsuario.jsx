import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Bookmark, Shield, LogOut } from 'lucide-react';
import { useSessao } from '../ganchos/useSessao.jsx';
import { useAvisos } from '../ganchos/useAvisos.jsx';
import Avatar from './Avatar.jsx';
import { milhar } from '../util/formatos.js';

// Avatar no topo com menu: perfil, lista, painel admin e sair
export default function MenuUsuario() {
  const { usuario, sair, ehAdmin } = useSessao();
  const avisar = useAvisos();
  const [aberto, setAberto] = useState(false);
  const caixa = useRef(null);
  useEffect(() => {
    const fora = (e) => !caixa.current?.contains(e.target) && setAberto(false);
    addEventListener('mousedown', fora);
    return () => removeEventListener('mousedown', fora);
  }, []);
  const t = usuario.tier;
  return (
    <div className="menu-usuario" ref={caixa}>
      <button className="menu-usuario-botao" onClick={() => setAberto((v) => !v)} aria-expanded={aberto} aria-label="Sua conta"><Avatar usuario={usuario} tamanho={36} /></button>
      {aberto && (
        <div className="topo-menu menu-usuario-painel" onClick={() => setAberto(false)}>
          <div className="menu-usuario-topo">
            <Avatar usuario={usuario} tamanho={44} />
            <span><strong>{usuario.nome}</strong><small style={{ color: t.cor }}>{t.nome} · {milhar(usuario.xp)} XP</small></span>
          </div>
          <div className="barra-xp" title={t.proximo ? `Faltam ${t.faltam} XP para ${t.proximo}` : 'Tier máximo'}><i style={{ width: `${t.progresso * 100}%`, background: t.cor }} /></div>
          <Link to={`/perfil/${usuario.id}`} className="topo-menu-item"><User size={17} />Meu perfil</Link>
          <Link to="/minha-lista" className="topo-menu-item"><Bookmark size={17} />Minha lista</Link>
          {ehAdmin && <Link to="/admin" className="topo-menu-item"><Shield size={17} />Painel admin</Link>}
          <button className="topo-menu-item" onClick={() => { sair(); avisar('Você saiu da conta'); }}><LogOut size={17} />Sair</button>
        </div>
      )}
    </div>
  );
}
