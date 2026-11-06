'use client';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { AtividadePerfil, CartaoPerfil as Cartao, PessoaSocial } from '@/lib/social';
import { requisicaoSocial } from '@/lib/social-cliente';
import AcoesAmizade from './acoes-amizade';
import { EmblemaConquista } from './emblema-conquista';
import './social.css';
import './cartao-perfil.css';

type Props = { pessoa: PessoaSocial; usuarioId?: string; navegar?: (pagina: string, params?: Record<string,string>) => void; children?: ReactNode };
export function AvatarComunidade({ nome, avatar, pequeno = false }: { nome: string; avatar?: string; pequeno?: boolean }) {
 const [falhou, setFalhou] = useState('');
 return <span className={`social-avatar${pequeno ? ' pequeno' : ''}`} aria-hidden="true">{avatar && falhou !== avatar ? <img src={avatar} alt="" loading="lazy" onError={() => setFalhou(avatar)}/> : nome.slice(0,1).toUpperCase()}</span>;
}
export function AtividadeComunidade({ atividade }: { atividade: AtividadePerfil | null }) {
 const [relogio, setRelogio] = useState(0);
 useEffect(() => {queueMicrotask(() => setRelogio(Date.now()));const timer = setInterval(() => setRelogio(Date.now()),30000);return () => clearInterval(timer);}, []);
 if (!atividade) return null;
 const agora = relogio > 0 && relogio - atividade.atualizadoEm < 120000;
 return <p className="perfil-atividade"><strong>{agora ? 'Assistindo agora' : 'Última atividade compartilhada'}</strong>
 <span>{atividade.titulo} · Episódio {atividade.episodio}</span><time dateTime={new Date(atividade.atualizadoEm).toISOString()}>{new Date(atividade.atualizadoEm).toLocaleString('pt-BR')}</time></p>;
}
export default function CartaoPerfil({ pessoa, usuarioId, navegar, children }: Props) {
 const [aberto, setAberto] = useState(false), [perfil, setPerfil] = useState<Cartao | null>(null), [erro, setErro] = useState('');
 const [posicao, setPosicao] = useState({left:8,top:8}), id = useId();
 const gatilho = useRef<HTMLButtonElement>(null), cartao = useRef<HTMLDivElement>(null), timer = useRef<ReturnType<typeof setTimeout> | null>(null);
 const vivo = useRef(true), pedido = useRef(0);
 const cancelar = () => { if (timer.current) clearTimeout(timer.current); };
 const abrir = () => { cancelar(); if(!aberto){setPerfil(null);setErro('');}setAberto(true); };
 const fecharDepois = () => { cancelar(); timer.current = setTimeout(() => setAberto(false), 200); };
 const carregar = useCallback(async () => {
  const atual = ++pedido.current;
  try { const r = await requisicaoSocial<{perfil:Cartao}>({acao:'cartao-perfil',usuarioId:pessoa.id}); if (vivo.current && atual === pedido.current) {setPerfil(r.perfil);setErro('');} }
  catch(e) { if (vivo.current && atual === pedido.current) {setPerfil(null);setErro(e instanceof Error ? e.message : 'Não foi possível abrir o cartão.');} }
 }, [pessoa.id]);
 useEffect(() => { vivo.current = true; return () => {vivo.current=false;cancelar();}; }, []);
 useEffect(() => { if (aberto) queueMicrotask(() => {if(vivo.current)void carregar();}); }, [aberto, carregar]);
 const posicionar = useCallback(() => {
  const rect = gatilho.current?.getBoundingClientRect(); if (!rect) return;
  const largura = Math.min(340, window.innerWidth - 16), altura = cartao.current?.offsetHeight || 400;
  const top = rect.bottom + 8 + altura <= window.innerHeight - 8 ? rect.bottom + 8 : Math.max(8, rect.top - altura - 8);
  setPosicao({left: Math.max(8,Math.min(rect.left,window.innerWidth-largura-8)),top: Math.min(top, Math.max(8,window.innerHeight-altura-8))});
 }, []);
 useLayoutEffect(() => {
  if (!aberto) return;
  posicionar(); const observer = new ResizeObserver(posicionar); if(cartao.current) observer.observe(cartao.current);
  window.addEventListener('resize',posicionar); window.addEventListener('scroll',posicionar,true);
  function fora(e: PointerEvent) { if (!cartao.current?.contains(e.target as Node) && !gatilho.current?.contains(e.target as Node)) setAberto(false); }
  document.addEventListener('pointerdown',fora);
  return () => {observer.disconnect();window.removeEventListener('resize',posicionar);window.removeEventListener('scroll',posicionar,true);document.removeEventListener('pointerdown',fora);};
 }, [aberto,posicionar]);
 const atual = perfil || pessoa;
 return <span className="cartao-perfil-ancora" onMouseEnter={abrir} onMouseLeave={fecharDepois}>
  <button type="button" ref={gatilho} className="cartao-perfil-gatilho" aria-label={`Ver perfil de ${pessoa.nome}`} aria-haspopup="dialog" aria-expanded={aberto} aria-controls={aberto ? id : undefined}
   onFocus={abrir} onBlur={e => {if (!cartao.current?.contains(e.relatedTarget as Node)) fecharDepois();}} onClick={abrir}
   onKeyDown={e => {if(e.key==='Escape'){e.stopPropagation();cancelar();setAberto(false);}if(aberto && (e.key==='ArrowDown' || (e.key==='Tab' && !e.shiftKey))){e.preventDefault();cartao.current?.querySelector<HTMLButtonElement>('button')?.focus();}}}>
   {children || <><AvatarComunidade nome={pessoa.nome} avatar={pessoa.avatar} pequeno/><span>{pessoa.nome}</span></>}
  </button>
  {aberto && createPortal(<div id={id} ref={cartao} role="dialog" aria-label={`Perfil de ${pessoa.nome}`} className="cartao-perfil social-painel" style={posicao}
   onMouseEnter={cancelar} onMouseLeave={fecharDepois} onFocus={cancelar} onBlur={e => {if (!e.currentTarget.contains(e.relatedTarget as Node) && e.relatedTarget !== gatilho.current) fecharDepois();}}
   onKeyDown={e => {if(e.key==='Escape'){e.stopPropagation();gatilho.current?.focus();cancelar();setAberto(false);}if(e.key==='Tab' && e.shiftKey && e.target===cartao.current?.querySelector('button')){e.preventDefault();gatilho.current?.focus();}}}>
   {perfil?.banner && <img className="perfil-banner" src={perfil.banner} alt=""/>}
   <button type="button" className="cartao-perfil-fechar" aria-label="Fechar cartão de perfil" onClick={() => {gatilho.current?.focus();cancelar();setAberto(false);}}>Fechar</button>
   <div className="cartao-perfil-identidade"><AvatarComunidade nome={atual.nome} avatar={atual.avatar}/><div><strong>{atual.nome}</strong><span>@{atual.handle}</span><span>Nível {atual.nivel}</span></div></div>
   {!perfil && !erro && <p role="status">Carregando perfil…</p>}{erro && <p role="alert" className="social-erro">{erro}</p>}
   {perfil && <><div className="cartao-perfil-emblemas">{perfil.conquistas.map(c => <EmblemaConquista key={c.badgeId} badgeId={c.badgeId} tamanho={54}/>)}</div>
    <AtividadeComunidade atividade={perfil.atividade}/>{!perfil.acessivel && <p className="social-ajuda">Perfil privado. Envie uma solicitação de amizade para conhecer esta pessoa.</p>}
    {usuarioId && perfil.relacao !== 'proprio' && perfil.relacao !== 'amigo' && <AcoesAmizade pessoa={perfil} atualizar={carregar}/>}
    {perfil.acessivel && navegar && <button type="button" onClick={() => {setAberto(false);navegar('perfil-publico',{handle:perfil.handle});}}>Ver perfil completo</button>}
   </>}
  </div>,document.body)}
 </span>;
}
