'use client';
import {useEffect,useRef,useState} from 'react';
import type {EdicaoPerfil,PerfilSocial as Perfil} from '@/lib/social';
import {recompensasPerfil,visualDoPerfil,type ItemInventarioPerfil} from '@/lib/personalizacao-perfil';
import {requisicaoSocial} from '@/lib/social-cliente';
import PersonalizacaoPerfil from './personalizacao-perfil';
import PerfilImagensEditor from './perfil-imagens-editor';
import './social.css';
import './perfil-editor.css';

type Props={usuarioId:string;aoSalvar?:()=>void|Promise<void>;navegar?:(pagina:string,params?:Record<string,string>)=>void;aoPerfil?:(perfil:Perfil)=>void;aoPrevia?:(perfil:Perfil)=>void};
type Resposta={perfil:Perfil;inventario?:ItemInventarioPerfil[]};
const editar=(p:Perfil):EdicaoPerfil=>({nome:p.nome,handle:p.handle,bio:p.bio,publico:p.publico,mostrarConquistas:p.mostrarConquistas,avatar:p.avatar,banner:p.banner,compartilharAtividade:p.compartilharAtividade,visual:visualDoPerfil(p)});
const basicos=()=>recompensasPerfil.map(item=>({...item,liberada:!item.conquista&&!item.nivel}));
export default function PerfilSocial(props:Props){return <EditorPerfil key={props.usuarioId} {...props}/>;}
function EditorPerfil({aoSalvar,navegar,aoPerfil,aoPrevia}:Props){
 const [perfil,setPerfil]=useState<Perfil|null>(null),[edicao,setEdicao]=useState<EdicaoPerfil|null>(null),[inventario,setInventario]=useState<ItemInventarioPerfil[]>([]);
 const [erro,setErro]=useState(''),[sucesso,setSucesso]=useState(''),[ocupado,setOcupado]=useState(false),[consulta,setConsulta]=useState(''),[tentativa,setTentativa]=useState(0);
 const [envios,setEnvios]=useState({avatar:false,banner:false});
 const trava=useRef(false),vivo=useRef(true),versaoConsulta=useRef(0),callbacks=useRef({aoPerfil,aoPrevia});
 const imagemPendente=envios.avatar||envios.banner;
 useEffect(()=>{callbacks.current={aoPerfil,aoPrevia};},[aoPerfil,aoPrevia]);
 useEffect(()=>{
  vivo.current=true;const controle=new AbortController();
  void requisicaoSocial<Resposta>({acao:'perfil-social'},undefined,controle.signal).then(({perfil:p,inventario:i})=>{
   if(!p)throw new Error('Não foi possível carregar seu perfil.');
   if(controle.signal.aborted)return;setPerfil(p);setEdicao(editar(p));setInventario(i||basicos());setErro('');callbacks.current.aoPerfil?.(p);
  }).catch(e=>{if(!controle.signal.aborted)setErro(e.message);});
  return()=>{vivo.current=false;controle.abort();};
 },[tentativa]);
 useEffect(()=>{
  if(perfil&&edicao)callbacks.current.aoPrevia?.({...perfil,...edicao,avatar:edicao.avatar||'',banner:edicao.banner||'',compartilharAtividade:!!edicao.compartilharAtividade,visual:visualDoPerfil(edicao)});
 },[edicao,perfil]);
 const mudar=(mudanca:Partial<EdicaoPerfil>)=>{setEdicao(antes=>antes?{...antes,...mudanca}:antes);setSucesso('');};
 async function salvar(e:React.FormEvent){
  e.preventDefault();if(!edicao||trava.current||imagemPendente)return;
  trava.current=true;setOcupado(true);setErro('');setSucesso('');
  try{
   const {perfil:p,inventario:i}=await requisicaoSocial<Resposta>(null,{acao:'salvar-perfil-social',...edicao,visual:visualDoPerfil(edicao)});
   if(!vivo.current)return;setPerfil(p);setEdicao(editar(p));setInventario(i||basicos());callbacks.current.aoPerfil?.(p);setSucesso('Perfil salvo. Sua vitrine está atualizada.');await aoSalvar?.();
  }catch(e){if(vivo.current)setErro(e instanceof Error?e.message:'Não foi possível salvar. Sua personalização continua na prévia.');}
  finally{trava.current=false;if(vivo.current)setOcupado(false);}
 }
 async function verificar(){
  if(!edicao||trava.current||imagemPendente)return;const versao=++versaoConsulta.current;setConsulta('Consultando disponibilidade…');
  try{const r=await requisicaoSocial<{disponivel:boolean;sugestao:string}>({acao:'handle-disponivel',handle:edicao.handle});if(vivo.current&&versao===versaoConsulta.current)setConsulta(r.disponivel?'Este @ está disponível.':`Já está em uso. Sugestão disponível: @${r.sugestao}`);}
  catch(e){if(vivo.current&&versao===versaoConsulta.current)setConsulta(e instanceof Error?e.message:'Tente novamente.');}
 }
 return <section className="social-painel perfil-editor" aria-labelledby="social-editor-titulo">
  <header><div><span className="social-legenda">SEU PERFIL</span><h2 id="social-editor-titulo">Personalização e privacidade</h2><p>Capas, molduras e efeitos equipados acompanham seu perfil na comunidade.</p></div>{perfil&&navegar&&<button type="button" onClick={()=>navegar('perfil-publico',{handle:perfil.handle})}>Ver meu perfil</button>}</header>
  {erro&&<p role="alert" className="social-erro">{erro}</p>}{sucesso&&<p role="status" className="perfil-editor-sucesso">{sucesso}</p>}
  {edicao&&<button type="button" className="perfil-ver-previa" onClick={()=>document.querySelector('.perfil-pagina .perfil-vitrine')?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'})}>Ver prévia da vitrine</button>}
  {!edicao?<p role="status">{erro?<button type="button" onClick={()=>setTentativa(t=>t+1)}>Tentar novamente</button>:'Carregando seu perfil…'}</p>:<form onSubmit={salvar}>
   <PersonalizacaoPerfil valor={visualDoPerfil(edicao)} inventario={inventario} banner={edicao.banner} disabled={ocupado||imagemPendente} aoMudar={visual=>mudar({visual})}/>
   <PerfilImagensEditor edicao={edicao} ocupado={ocupado} envios={envios} aoOcupar={(tipo,ativo)=>setEnvios(v=>({...v,[tipo]:ativo}))} aoMudar={mudar}/>
   <fieldset className="perfil-editor-grupo"><legend>Nome e apresentação</legend><div className="social-campos"><label>Nome público<input required minLength={2} maxLength={60} value={edicao.nome} disabled={ocupado} onChange={e=>mudar({nome:e.target.value})}/></label>
    <label>Identificador @<input required minLength={3} maxLength={24} pattern="[a-zA-Z0-9][a-zA-Z0-9_]{2,23}" autoCapitalize="none" spellCheck={false} aria-describedby="social-handle-ajuda" value={edicao.handle} disabled={ocupado} onChange={e=>{mudar({handle:e.target.value});versaoConsulta.current++;setConsulta('');}}/></label></div>
    <p id="social-handle-ajuda" className="social-ajuda">De 3 a 24 letras, números ou sublinhado. Letras maiúsculas são convertidas para minúsculas.</p>
    <div className="social-consulta"><button type="button" disabled={ocupado||imagemPendente} onClick={()=>void verificar()}>Verificar @</button><span role="status">{consulta}</span></div>
    <label>Biografia<textarea maxLength={280} rows={3} value={edicao.bio} disabled={ocupado} onChange={e=>mudar({bio:e.target.value})}/><small>{edicao.bio.length}/280</small></label>
   </fieldset>
   <fieldset className="perfil-editor-grupo"><legend>Quem pode ver</legend><label className="social-checkbox"><input type="checkbox" checked={edicao.publico} disabled={ocupado} onChange={e=>mudar({publico:e.target.checked})}/><span>Permitir encontrar meu perfil na busca e abrir pelo @</span></label>
    <p className="social-ajuda">Com o perfil privado, apenas você e suas amizades atuais podem abri-lo. Sua coleção e seu histórico permanecem pessoais.</p>
    <label className="social-checkbox"><input type="checkbox" checked={edicao.mostrarConquistas} disabled={ocupado} onChange={e=>mudar({mostrarConquistas:e.target.checked})}/><span>Mostrar minhas conquistas em destaque no perfil</span></label>
    <label className="social-checkbox"><input type="checkbox" checked={!!edicao.compartilharAtividade} disabled={ocupado} onChange={e=>mudar({compartilharAtividade:e.target.checked})}/><span>Compartilhar o anime e o episódio que estou assistindo</span></label>
    <p className="social-ajuda">Desativado por padrão. Quando ativado, apenas quem pode abrir seu perfil vê sua atividade mais recente.</p>
   </fieldset>
   <div className="social-final perfil-editor-salvar"><button type="submit" disabled={ocupado||imagemPendente}>{ocupado?'Salvando…':'Salvar perfil'}</button><span>{imagemPendente?'Aguarde o envio das imagens antes de salvar.':'As alterações só ficam públicas depois de salvar.'}</span></div>
  </form>}
 </section>;
}
