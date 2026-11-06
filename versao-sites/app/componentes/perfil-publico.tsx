'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PerfilSocial } from '@/lib/social';
import { requisicaoSocial } from '@/lib/social-cliente';
import { EmblemaConquista } from './emblema-conquista';
import AcoesAmizade from './acoes-amizade';
import { AtividadeComunidade, AvatarComunidade } from './cartao-perfil';
import './social.css';
type Props = { handle: string; usuarioId?: string; navegar?: (pagina: string, params?: Record<string,string>) => void };
export default function PerfilPublico(props: Props) { return <Perfil key={`${props.usuarioId || 'visitante'}:${props.handle}`} {...props}/>; }
function Perfil({ handle, usuarioId, navegar }: Props) {
 const [perfil, setPerfil] = useState<PerfilSocial | null>(null), [erro, setErro] = useState(''), [carregando, setCarregando] = useState(true);
 const vivo = useRef(true), versao = useRef(0);
 const carregar = useCallback(async () => {
  const atual = ++versao.current;
  try {
   const r = await requisicaoSocial<{perfil:PerfilSocial}>({acao:'perfil-publico',handle});
   if (vivo.current && atual === versao.current) {setPerfil(r.perfil);setErro('');}
  } catch(e) { if(vivo.current && atual === versao.current) {setPerfil(null);setErro(e instanceof Error ? e.message : 'Não foi possível abrir o perfil.');} }
  finally { if(vivo.current && atual === versao.current)setCarregando(false); }
 },[handle]);
 useEffect(() => { vivo.current=true;queueMicrotask(()=>{if(vivo.current)void carregar();});return()=>{vivo.current=false;}; },[carregar]);
 return <section className="social-painel social-perfil-publico" aria-label="Perfil da comunidade">
  {carregando && <p role="status">Carregando perfil…</p>}
  {erro && <div><p role="alert" className="social-erro">{erro}</p><button type="button" onClick={() => void carregar()}>Tentar novamente</button></div>}
  {perfil && <>
   {perfil.banner && <img className="perfil-banner" src={perfil.banner} alt=""/>}
   <div className="social-perfil-topo"><AvatarComunidade nome={perfil.nome} avatar={perfil.avatar}/><div><span className="social-legenda">COMUNIDADE YOKIRA</span><h1>{perfil.nome}</h1><p>@{perfil.handle} <span>· Nível {perfil.nivel}</span></p></div></div>
   <div className="perfil-progresso"><span>Nível {perfil.nivel}</span><progress max={100} value={perfil.xp % 100} aria-label="Progresso para o próximo nível"/><span>{perfil.xp % 100}/100 XP até o nível {perfil.nivel + 1}</span></div>
   <p className="social-ajuda">Na comunidade desde {new Date(perfil.criadoEm).toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</p>
   <AtividadeComunidade atividade={perfil.atividade}/>
   {perfil.bio && <p className="social-biografia">{perfil.bio}</p>}
   {!perfil.publico && <p className="social-ajuda">Perfil privado. Visível para você e amizades aceitas.</p>}
   {usuarioId && perfil.relacao !== 'proprio' && <AcoesAmizade pessoa={perfil} atualizar={carregar}/>}
   {perfil.relacao === 'proprio' && navegar && <button type="button" onClick={() => navegar('perfil')}>Editar meu perfil</button>}
   {!usuarioId && <p className="social-ajuda">Entre na sua conta para enviar uma solicitação de amizade.</p>}
   {perfil.mostrarConquistas && <div className="social-destaques"><h2>Conquistas em destaque</h2>{perfil.conquistas.length ? <ul>{perfil.conquistas.slice(0,3).map(c => <li key={c.badgeId}><EmblemaConquista badgeId={c.badgeId} tamanho={76} animado/><strong>{c.titulo}</strong><span>{c.descricao}</span></li>)}</ul> : <p className="social-ajuda">Nenhuma conquista em destaque.</p>}</div>}
  </>}
 </section>;
}
