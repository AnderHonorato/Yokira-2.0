'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import type {SalaDetalhe} from '../../lib/salas';
import Player from './player';
import SalaChat from './sala-chat';
import {apiSala,lerSala} from './salas-api';
import './salas.css';

type Props={salaId:string;usuarioId:string;onSair:()=>void};
export default function Sala({salaId,usuarioId,onSair}:Props) {
 const [sala,setSala]=useState<SalaDetalhe|null>(null),[erro,setErro]=useState(''),[ocupado,setOcupado]=useState(false);
 const [escolha,setEscolha]=useState(''),[incorporado,setIncorporado]=useState(''),[confirmar,setConfirmar]=useState(''),[copiado,setCopiado]=useState(false);
 const referencia=useRef<SalaDetalhe|null>(null),ativo=useRef(true),syncExecutando=useRef(false);
 const controle=useRef<{pausado:boolean;posicao:number}|null>(null),timerControle=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const aceitar=useCallback((nova:SalaDetalhe)=>{
  if(!ativo.current)return;
  const anterior=referencia.current;
  if(anterior&&anterior.id===nova.id&&anterior.estado.revisao>nova.estado.revisao)nova={...nova,estado:anterior.estado};
  referencia.current=nova;setSala(nova);setErro('');
 },[]);
 useEffect(()=>{
  ativo.current=true;let cancelado=false,falhas=0,timer:ReturnType<typeof setTimeout>;
  const abort=new AbortController();
  const carregar=async()=>{
   try{aceitar(await lerSala<SalaDetalhe>(salaId,abort.signal));falhas=0;}
   catch(e){if(!cancelado){falhas++;setErro(e instanceof Error?e.message:'Sala indisponível.');setSala(null);referencia.current=null;}}
   if(!cancelado)timer=setTimeout(()=>void carregar(),Math.min(30000,2000*2**Math.min(falhas,4)));
  };
  void carregar();
  return()=>{cancelado=true;ativo.current=false;abort.abort();clearTimeout(timer);clearTimeout(timerControle.current);controle.current=null;};
 },[salaId,aceitar]);
 const atualizar=async()=>aceitar(await lerSala<SalaDetalhe>(salaId));
 const acao=async(nome:string,dados:Record<string,unknown>={})=>{
  if(ocupado)return;setOcupado(true);setErro('');
  try{await apiSala(nome,{salaId,...dados});if(nome==='sala-encerrar'||nome==='sala-sair')onSair();else await atualizar();}
  catch(e){setErro(e instanceof Error?e.message:'Ação não concluída.');throw e;}
  finally{if(ativo.current)setOcupado(false);}
 };
 const sincronizar=useCallback(async function publicarControle(){
  if(syncExecutando.current||!controle.current||!referencia.current||!ativo.current)return;
  const estado=controle.current;controle.current=null;syncExecutando.current=true;
  try{
   await apiSala('sala-sincronizar',{salaId,...estado,revisao:referencia.current.estado.revisao});
   aceitar(await lerSala<SalaDetalhe>(salaId));
  }catch(e){if(ativo.current)setErro(e instanceof Error?e.message:'Não foi possível sincronizar.');}
  finally{syncExecutando.current=false;if(controle.current&&ativo.current)timerControle.current=setTimeout(()=>void publicarControle(),300);}
 },[salaId,aceitar]);
 const controlar=useCallback((pausado:boolean,posicao:number)=>{
  controle.current={pausado,posicao};clearTimeout(timerControle.current);timerControle.current=setTimeout(()=>void sincronizar(),300);
 },[sincronizar]);
 async function copiarConvite(){
  try{const codigo=referencia.current?.convite;if(!codigo)return;await navigator.clipboard.writeText(`${window.location.origin}/?p=salas&convite=${codigo}`);setCopiado(true);}
  catch{setErro('Não foi possível copiar. Copie o código do campo de convite.');}
 }
 const sair=()=>{if(sala?.donoId===usuarioId)setConfirmar('encerrar');else void acao('sala-sair').catch(()=>{});};
 if(!sala)return <section className="salas-pagina"><button className="button" onClick={onSair}>Voltar às salas</button><p role={erro?'alert':'status'}>{erro||'Carregando sala…'}</p></section>;
 const dono=sala.donoId===usuarioId,fonte=sala.episodio.fontes.find(f=>f.id===escolha)||sala.episodio.fontes[0];
 const convite=sala.convite;
 return <section className="salas-pagina">
  <header className="sala-cabecalho"><div><span className="eyebrow">{sala.modo==='dupla'?'Sala em dupla':'Sala em grupo'}</span><h1>{sala.episodio.titulo}</h1><p>{sala.participantes}/{sala.modo==='dupla'?2:12} participantes · {dono?'Você controla o vídeo':'O dono controla o vídeo'}</p></div><button className="button" disabled={ocupado} onClick={sair}>{dono?'Encerrar sala':'Sair da sala'}</button></header>
  {erro&&<p className="sala-erro" role="alert">{erro}</p>}
  {confirmar&&<div className="sala-confirmacao" role="group" aria-label="Confirmar ação"><p>{confirmar==='encerrar'?'Encerrar a sala para todas as pessoas?':'Expulsar esta pessoa? O convite atual não permitirá seu retorno.'}</p><button className="button" disabled={ocupado} onClick={()=>{void acao(confirmar==='encerrar'?'sala-encerrar':'sala-expulsar',{usuarioId:confirmar}).then(()=>setConfirmar('')).catch(()=>{});}}>Confirmar</button><button className="button" onClick={()=>setConfirmar('')}>Cancelar</button></div>}
  {dono&&convite&&<div className="sala-convite"><label htmlFor="sala-convite">Convite privado</label><input id="sala-convite" readOnly value={convite}/><button className="button" onClick={()=>void copiarConvite()}>{copiado?'Copiado':'Copiar link'}</button><small>Compartilhe o link ou código com quem você deseja na sala.</small></div>}
  <div className="sala-grade"><div><div className="sala-fontes" aria-label="Escolher player">{sala.episodio.fontes.map(f=><button className="button" key={f.id} aria-pressed={fonte?.id===f.id} onClick={()=>{setEscolha(f.id);setIncorporado('');}}>{f.nome}</button>)}</div>
   {fonte?.tipo==='direto'?<Player key={sala.episodioId+fonte.id} url={fonte.url} titulo={sala.episodio.titulo} poster={sala.episodio.poster} sincronizacao={{estado:sala.estado,dono,onControle:controlar}}/>:fonte&&<div className="sala-incorporado"><p role="status">Este player externo não permite sincronizar reprodução ou posição pela sala. Combine os controles pela conversa ou escolha um player Yokira.</p>{incorporado===fonte.id?<iframe src={fonte.url} title={fonte.nome} sandbox="allow-scripts allow-same-origin allow-presentation allow-popups" referrerPolicy="no-referrer" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowFullScreen/>:<button className="button button-primary" onClick={()=>setIncorporado(fonte.id)}>Carregar {fonte.nome}</button>}</div>}
   <section className="sala-participantes" aria-label="Participantes"><h2>Participantes</h2><ul>{sala.membros.map(m=><li key={m.usuarioId}><span>{m.nome}{m.dono?' · Dono':''}{m.usuarioId===usuarioId?' · Você':''}</span>{dono&&!m.dono&&<button className="button" disabled={ocupado} onClick={()=>setConfirmar(m.usuarioId)}>Expulsar</button>}</li>)}</ul></section>
  </div><SalaChat mensagens={sala.mensagens} ocupado={ocupado} enviar={corpo=>acao('sala-mensagem',{corpo})}/></div>
 </section>;
}
