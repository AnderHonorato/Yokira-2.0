'use client';

import { useEffect, useRef, useState } from 'react';
import Player from './player';
import './fontes-player.css';

type Fonte = {id:string;nome:string;tipo:'direto'|'drive'|'incorporado';url:string;ordem:number;ativo:boolean};
type Episodio = {id:string;titulo:string;videoUrl:string;poster:string;numero:number;fontes?:Fonte[]};
type Props = {tituloId:string;episodioId:string;idioma:string;usuario:Record<string,unknown>|null;
 progresso:{tituloId:string;segundos:number}[];navegar:(pagina:string,parametros?:Record<string,string>)=>void};

export default function Reproducao({tituloId,episodioId,idioma,usuario,progresso,navegar}:Props) {
 const [episodios,setEpisodios]=useState<Episodio[]>([]);
 const [posicoes,setPosicoes]=useState<Record<string,number>>({});
 const chavePosicao=String(usuario?.id||'anonimo')+':'+episodioId;
 const posicoesLocais=useRef(new Set<string>());
 const [escolha,setEscolha]=useState('');const [incorporado,setIncorporado]=useState('');
 const [erro,setErro]=useState('');const [carregando,setCarregando]=useState(true);const [tentativa,setTentativa]=useState(0);
 const [erroProgresso,setErroProgresso]=useState('');const avisoRef=useRef(false);
 useEffect(()=>{
  const controle=new AbortController();
  async function carregar(){
   setCarregando(true);setErro('');
   try{
    const resposta=await fetch('/api/yokira?acao=episodios&tituloId='+encodeURIComponent(tituloId),{signal:controle.signal,cache:'no-store'});
    const dados=await resposta.json() as {episodios?:Episodio[];erro?:string};
    if(!resposta.ok)throw new Error(dados.erro||'Não foi possível carregar o episódio.');
    if(!dados.episodios?.some(item=>item.id===episodioId))throw new Error('Este episódio está indisponível.');
    setEpisodios(dados.episodios);
   }catch(falha){if(!controle.signal.aborted)setErro(falha instanceof Error?falha.message:'Não foi possível carregar o episódio.');}
   finally{if(!controle.signal.aborted)setCarregando(false);}
  }
  void carregar();return()=>controle.abort();
 },[tituloId,episodioId,tentativa]);
 useEffect(()=>{
  if(!usuario?.id)return;
  const controle=new AbortController();
  void fetch('/api/yokira?acao=progresso-episodio&episodioId='+encodeURIComponent(episodioId),{signal:controle.signal,cache:'no-store'})
   .then(async resposta=>{if(!resposta.ok)throw new Error();return resposta.json() as Promise<{segundos:number}>;})
   .then(dados=>{if(!controle.signal.aborted&&!posicoesLocais.current.has(chavePosicao))setPosicoes(anteriores=>({...anteriores,[chavePosicao]:dados.segundos}));})
   .catch(()=>{if(!controle.signal.aborted)setErroProgresso('Não foi possível carregar sua posição salva.');});
  return()=>controle.abort();
 },[episodioId,usuario?.id,chavePosicao]);
 const atual=episodios.find(item=>item.id===episodioId);
 const fontes=atual?.fontes?.filter(item=>item.ativo)|| (atual?.videoUrl?[{id:'principal',nome:'Servidor principal',tipo:'direto' as const,url:atual.videoUrl,ordem:1,ativo:true}]:[]);
 const fonte=fontes.find(item=>item.id===escolha)||fontes[0];
 const proximo=episodios[episodios.findIndex(item=>item.id===episodioId)+1];
 async function salvar(segundos:number){
  if(!usuario)return;
  posicoesLocais.current.add(chavePosicao);
  setPosicoes(anteriores=>({...anteriores,[chavePosicao]:segundos}));
  try{
   const resposta=await fetch('/api/yokira',{method:'POST',headers:{'Content-Type':'application/json'},keepalive:true,
    body:JSON.stringify({acao:'progresso-episodio',tituloId,episodioId,segundos})});
   if(!resposta.ok&&!avisoRef.current){avisoRef.current=true;setErroProgresso('Não foi possível salvar sua posição. A reprodução continua disponível.');}
  }catch{if(!avisoRef.current){avisoRef.current=true;setErroProgresso('Sem conexão para salvar sua posição.');}}
 }
 return <section className="player-page"><div className="page-heading"><div><span className="eyebrow">YOKIRA PLAYER</span><h1>{atual?.titulo||'Reprodução'}</h1></div><button className="button" onClick={()=>navegar('titulo',{id:tituloId})}>Voltar ao título</button></div>
  {carregando?<p role="status">Carregando episódio…</p>:erro?<div className="empty-state" role="alert"><h2>{erro}</h2><button className="button" onClick={()=>setTentativa(valor=>valor+1)}>Tentar novamente</button></div>:atual&&<>
   <section className="fontes-player" aria-label="Escolher player"><div><span className="eyebrow">SEU JEITO DE ASSISTIR</span><h2>Escolha o player</h2><p>{fontes.length} {fontes.length===1?'opção disponível':'opções disponíveis'} para este vídeo.</p></div><div className="fontes-player-opcoes">{fontes.map(item=><button key={item.id} className="button" aria-pressed={fonte?.id===item.id} onClick={()=>{setEscolha(item.id);setIncorporado('');}}><strong>{item.nome}</strong><small>{item.tipo==='drive'?'Google Drive':item.tipo==='incorporado'?'Player incorporado':'Player Yokira'}</small></button>)}</div></section>
   {fonte?.tipo==='direto'?<Player key={episodioId+fonte.id} url={fonte.url} titulo={atual.titulo} poster={atual.poster} idioma={idioma}
    inicio={posicoes[chavePosicao]??progresso.find(item=>item.tituloId===`episodio:${episodioId}`)?.segundos??0} onProgresso={segundos=>void salvar(segundos)}/>:fonte&&<div className="fontes-player-externo">
    {incorporado===fonte.id?<iframe key={episodioId+fonte.id} src={fonte.url} title={atual.titulo+' — '+fonte.nome} sandbox="allow-scripts allow-same-origin allow-presentation allow-popups" referrerPolicy="no-referrer" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowFullScreen/>:<div className="fontes-player-carregar"><h3>{fonte.nome}</h3><p>Abra este player para assistir pelo provedor selecionado.</p><button className="button button-primary" onClick={()=>setIncorporado(fonte.id)}>Carregar {fonte.nome}</button></div>}
    <p>A retomada automática funciona no player Yokira. <a href={fonte.url} target="_blank" rel="noopener noreferrer">Abrir no provedor</a></p>
   </div>}
   {erroProgresso&&<p role="status">{erroProgresso}</p>}
   <div className="player-description"><p>{usuario?'Sua posição é salva na sua conta.':'Entre na sua conta para guardar sua posição entre dispositivos.'}</p>{proximo&&<button className="button" onClick={()=>navegar('player',{id:tituloId,episodio:proximo.id})}>Próximo episódio: {proximo.titulo}</button>}</div>
  </>}
 </section>;
}
