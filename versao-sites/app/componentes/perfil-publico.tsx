'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PerfilSocial } from '@/lib/social';
import { requisicaoSocial } from '@/lib/social-cliente';
import PerfilVitrine from './perfil-vitrine';
import VitrineDestaques from './vitrine-destaques';
import AcoesAmizade from './acoes-amizade';
import './social.css';
import './perfil-publico.css';
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
 return <section className="perfil-publico-pagina" aria-label="Perfil da comunidade">
  {carregando&&<div className="perfil-publico-estado" role="status">Carregando perfil…</div>}
  {erro&&<div className="social-painel perfil-publico-estado"><p role="alert" className="social-erro">{erro}</p><button type="button" onClick={()=>void carregar()}>Tentar novamente</button></div>}
  {perfil&&<>
   <PerfilVitrine perfil={perfil} acoes={<>
    {usuarioId&&perfil.relacao!=='proprio'&&<AcoesAmizade pessoa={perfil} atualizar={carregar}/>}
    {perfil.relacao==='proprio'&&navegar&&<button type="button" onClick={()=>navegar('perfil')}>Editar meu perfil</button>}
    {!usuarioId&&navegar&&<button type="button" onClick={()=>navegar('perfil')}>Entrar para adicionar amizade</button>}
   </>}/>
   {perfil.mostrarConquistas?<VitrineDestaques conquistas={perfil.conquistas}/>:<div className="perfil-publico-estado">Esta pessoa mantém suas conquistas em destaque privadas.</div>}
  </>}
 </section>;
}
