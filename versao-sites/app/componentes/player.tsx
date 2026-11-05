'use client';
import {useCallback,useEffect,useId,useRef,useState,type KeyboardEvent} from 'react';
import type Hls from 'hls.js';
import {Icone} from './icones';
import './player-extra.css';
import {usePlayerSala} from './player-sala';
import type {SincronizacaoPlayer} from '../../lib/salas';
type NivelHls={height:number;bitrate:number};
type Falha='midia'|'hls'|'inicio'|'tela'|null;
type VideoIos=HTMLVideoElement & {webkitEnterFullscreen?:()=>void};
type Props={url:string;titulo:string;poster?:string;onProgresso?:(segundos:number)=>void;inicio?:number;idioma?:string;sincronizacao?:SincronizacaoPlayer};
function tempo(segundos:number){
 const seguro=Number.isFinite(segundos)?Math.max(0,Math.floor(segundos)):0;
 return `${Math.floor(seguro/60)}:${String(seguro%60).padStart(2,'0')}`;
}
export default function Player({url,titulo,poster,onProgresso,inicio=0,idioma='pt',sincronizacao}:Props){
 const video=useRef<HTMLVideoElement>(null);
 const sala=usePlayerSala(video,sincronizacao,url);
 const box=useRef<HTMLDivElement>(null);
 const hls=useRef<Hls|null>(null);
 const progressoRef=useRef(onProgresso);
 const ultimoSalvo=useRef(-1);
 const interagiu=useRef(false);
 const ajudaId=useId();
 const [playing,setPlaying]=useState(false);
 const [time,setTime]=useState(0);
 const [duration,setDuration]=useState(0);
 const [volume,setVolume]=useState(1);
 const [muted,setMuted]=useState(false);
 const [falha,setFalha]=useState<Falha>(null);
 const [carregando,setCarregando]=useState(true);
 const [levels,setLevels]=useState<NivelHls[]>([]);
 const [quality,setQuality]=useState('-1');
 const [speed,setSpeed]=useState('1');
 const [tentativa,setTentativa]=useState(0);
 const ehHls=/\.m3u8(?:\?|$)/i.test(url);
 const tr=(pt:string,en:string,es:string)=>idioma==='en'?en:idioma==='es'?es:pt;
 const mensagens={
  midia:tr('Este vídeo não está disponível agora. Confira sua conexão e tente novamente.','This video is unavailable right now. Check your connection and try again.','Este vídeo no está disponible. Comprueba tu conexión e inténtalo de nuevo.'),
  hls:tr('Não foi possível carregar a transmissão HLS neste navegador.','Could not load the HLS stream in this browser.','No se pudo cargar la transmisión HLS en este navegador.'),
  inicio:tr('Não foi possível iniciar o vídeo. Tente novamente.','Could not start the video. Please try again.','No se pudo iniciar el vídeo. Inténtalo de nuevo.'),
  tela:tr('A tela cheia não está disponível neste navegador.','Fullscreen is unavailable in this browser.','La pantalla completa no está disponible en este navegador.')
 };
 useEffect(()=>{progressoRef.current=onProgresso;},[onProgresso]);
 const registrar=useCallback((v:HTMLVideoElement,forcar=false)=>{
  if(!interagiu.current||v.readyState<1||!Number.isFinite(v.currentTime))return;
  const atual=Math.max(0,Math.floor(v.currentTime));
  if(atual===ultimoSalvo.current||(!forcar&&Math.abs(atual-ultimoSalvo.current)<10))return;
  ultimoSalvo.current=atual;
  progressoRef.current?.(atual);
 },[]);
 const retomar=useCallback(()=>{
  const v=video.current;
  // Identity and saved progress can arrive after metadata. Never move a viewer
  // who has already pressed play or sought the timeline.
  if(!v||v.readyState<1||interagiu.current||!Number.isFinite(inicio)||inicio<=v.currentTime)return;
  if(Number.isFinite(v.duration)&&inicio>=v.duration)return;
  v.currentTime=Math.max(0,inicio);
  ultimoSalvo.current=Math.floor(inicio);
 },[inicio]);
 useEffect(()=>{retomar();},[retomar]);
 useEffect(()=>{
  const v=video.current;
  if(!v)return;
  let encerrado=false;
  queueMicrotask(()=>{if(!encerrado){setLevels([]);setQuality('-1');setDuration(0);setTime(0);setFalha(null);}});
  interagiu.current=false;
  ultimoSalvo.current=-1;
  const sair=()=>registrar(v,true);
  window.addEventListener('pagehide',sair);
  const ocultar=()=>{if(document.visibilityState==='hidden')registrar(v,true);};
  document.addEventListener('visibilitychange',ocultar);
  if(ehHls){
   void import('hls.js').then(({default:Hls})=>{
    if(encerrado)return;
    if(!Hls.isSupported()){if(v.canPlayType('application/vnd.apple.mpegurl')){v.src=url;v.load();return;}setFalha('hls');setCarregando(false);return;}
    const instancia=new Hls();
    hls.current=instancia;
    instancia.on(Hls.Events.MANIFEST_PARSED,()=>{if(!encerrado){setLevels(instancia.levels);setQuality('-1');}});
    instancia.on(Hls.Events.ERROR,(_evento,dados)=>{
     if(dados.fatal&&!encerrado){registrar(v,true);setFalha('hls');setCarregando(false);instancia.destroy();if(hls.current===instancia)hls.current=null;}
    });
    instancia.loadSource(url);
    instancia.attachMedia(v);
   }).catch(()=>{if(!encerrado){if(v.canPlayType('application/vnd.apple.mpegurl')){v.src=url;v.load();return;}setFalha('hls');setCarregando(false);}});
  }else{
   v.src=url;
   v.load();
  }
  return()=>{
   registrar(v,true);
   encerrado=true;
   window.removeEventListener('pagehide',sair);
   document.removeEventListener('visibilitychange',ocultar);
   hls.current?.destroy();
   hls.current=null;
   v.pause();
   v.removeAttribute('src');
   v.load();
  };
 },[url,ehHls,tentativa,registrar]);
 const toggle=async()=>{
  const v=video.current;if(!v)return;
  sala.ativar();if(sala.bloqueado)return;
  interagiu.current=true;
  if(!v.paused){v.pause();return;}
  try{await v.play();}catch{setFalha('inicio');setCarregando(false);}
 };
 const buscar=(segundos:number)=>{
  const v=video.current;if(!v||v.readyState<1||sala.bloqueado)return;
  sala.ativar();interagiu.current=true;
  v.currentTime=Math.max(0,Math.min(Number.isFinite(v.duration)?v.duration:segundos,segundos));
  setTime(v.currentTime);
  registrar(v,true);
 };
 const alternarSom=()=>{const v=video.current;if(v){v.muted=!v.muted;if(!v.muted&&v.volume===0)v.volume=.5;}};
 const telaCheia=async()=>{
  try{
   if(document.fullscreenElement){await document.exitFullscreen();return;}
   if(box.current?.requestFullscreen){await box.current.requestFullscreen();return;}
   const ios=video.current as VideoIos|null;
   if(ios?.webkitEnterFullscreen){ios.webkitEnterFullscreen();return;}
   setFalha('tela');
  }catch{setFalha('tela');}
 };
 const teclado=(evento:KeyboardEvent<HTMLDivElement>)=>{
  const alvo=evento.target as HTMLElement;
  if(alvo.closest('input,select,textarea,[contenteditable="true"]'))return;
  // Space/Enter on a focused button retain their native action. Letter keys
  // and arrows still work from buttons inside this player only.
  if((evento.key===' '||evento.key==='Enter')&&alvo.closest('button'))return;
  const tecla=evento.key.toLowerCase();
  if(tecla===' '||tecla==='k'){evento.preventDefault();void toggle();}
  else if(tecla==='arrowright'){evento.preventDefault();buscar((video.current?.currentTime||0)+10);}
  else if(tecla==='arrowleft'){evento.preventDefault();buscar((video.current?.currentTime||0)-10);}
  else if(tecla==='m'){evento.preventDefault();alternarSom();}
  else if(tecla==='f'){evento.preventDefault();void telaCheia();}
 };
 const tentarNovamente=()=>{
  setFalha(null);setCarregando(true);setLevels([]);setQuality('-1');setPlaying(false);
  // Re-run source setup for MP4, native HLS and hls.js, including fatal errors.
  setTentativa(n=>n+1);
 };
 const limite=Number.isFinite(duration)?Math.max(0,duration):0;
 const legendaSom=muted||volume===0?tr('Ativar som','Unmute','Activar sonido'):tr('Silenciar','Mute','Silenciar');
 const legendaPlay=playing?tr('Pausar','Pause','Pausar'):tr('Reproduzir','Play','Reproducir');
 const erroBloqueante=falha&&falha!=='tela';
 return <div className="player-shell">
  <div className="yokira-player player-accessible" ref={box} tabIndex={0} role="group" aria-label={tr(`Player: ${titulo}`,`Player: ${titulo}`,`Reproductor: ${titulo}`)} aria-describedby={ajudaId} onKeyDown={teclado}>
   <video ref={video} poster={poster} playsInline preload="metadata" onClick={()=>void toggle()} onPlay={()=>{interagiu.current=true;setPlaying(true);setFalha(null);}} onPlaying={()=>setCarregando(false)} onPause={()=>{setPlaying(false);if(video.current)registrar(video.current,true);}} onWaiting={()=>setCarregando(true)} onCanPlay={()=>setCarregando(false)} onLoadStart={()=>{setCarregando(true);setPlaying(false);setFalha(null);}} onError={()=>{setFalha('midia');setCarregando(false);}} onLoadedMetadata={()=>{
    const v=video.current;if(v){setDuration(v.duration);setSpeed(String(v.playbackRate));setVolume(v.volume);setMuted(v.muted);retomar();}
   }} onDurationChange={()=>{if(video.current)setDuration(video.current.duration);}} onTimeUpdate={()=>{
    const v=video.current;if(v){setTime(v.currentTime);registrar(v);}
   }} onVolumeChange={()=>{if(video.current){setVolume(video.current.volume);setMuted(video.current.muted);}}} onRateChange={()=>{if(video.current)setSpeed(String(video.current.playbackRate));}} onEnded={()=>{setPlaying(false);if(video.current)registrar(video.current,true);}} aria-label={titulo}/>
   {!playing&&!erroBloqueante&&<button className="player-center" onClick={()=>void toggle()} aria-label={tr('Reproduzir vídeo','Play video','Reproducir vídeo')} title={tr('Reproduzir vídeo','Play video','Reproducir vídeo')}><Icone nome="play" tamanho={32}/></button>}
   {carregando&&!erroBloqueante&&playing&&<span className="player-loading" role="status">{tr('Carregando vídeo…','Loading video…','Cargando vídeo…')}</span>}
   {erroBloqueante&&<div className="player-error" role="alert"><p>{mensagens[falha!]}</p><button className="button" onClick={tentarNovamente}>{tr('Tentar novamente','Try again','Reintentar')}</button></div>}
   {falha==='tela'&&<div className="player-fullscreen-note" role="status">{mensagens.tela}<button onClick={()=>setFalha(null)} aria-label={tr('Fechar aviso','Dismiss notice','Cerrar aviso')}><Icone nome="fechar" tamanho={14}/></button></div>}
   <div className="player-controls">
    <label className="player-progress"><span className="sr-only">{tr('Progresso do vídeo','Video progress','Progreso del vídeo')}</span><input type="range" min="0" max={limite} value={Math.min(time,limite)} step=".1" disabled={!limite||!!erroBloqueante||sala.bloqueado} aria-valuetext={`${tempo(time)} / ${tempo(duration)}`} onChange={e=>buscar(Number(e.target.value))}/></label>
    <div className="player-control-row">
     <button onClick={()=>void toggle()} aria-label={legendaPlay} title={`${legendaPlay} (K)`} disabled={!!erroBloqueante}><Icone nome={playing?'pause':'play'}/></button>
     <button onClick={alternarSom} aria-label={legendaSom} title={`${legendaSom} (M)`} aria-pressed={muted||volume===0}><Icone nome="som"/>{(muted||volume===0)&&<span className="muted-cross">×</span>}</button>
     <input className="volume-slider" type="range" min="0" max="1" step=".05" value={muted?0:volume} aria-label="Volume" onChange={e=>{const v=video.current;if(v){v.volume=Number(e.target.value);v.muted=v.volume===0;}}}/>
     <span className="player-clock mono">{tempo(time)} / {tempo(duration)}</span>
     <span className="player-spacer"/>
     <select disabled={!!sincronizacao} aria-label={tr('Velocidade','Playback speed','Velocidad')} title={tr('Velocidade','Playback speed','Velocidad')} value={speed} onChange={e=>{if(video.current)video.current.playbackRate=Number(e.target.value);}}><option value=".5">0.5×</option><option value=".75">0.75×</option><option value="1">1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="2">2×</option></select>
     {levels.length>0?<select aria-label={tr('Qualidade','Quality','Calidad')} title={tr('Qualidade','Quality','Calidad')} value={quality} onChange={e=>{setQuality(e.target.value);if(hls.current)hls.current.currentLevel=Number(e.target.value);}}><option value="-1">Auto</option>{levels.map((l,i)=><option value={i} key={i}>{l.height?`${l.height}p`:`${Math.round(l.bitrate/1000)} kbps`}</option>)}</select>:<span className="source-quality">{ehHls?'HLS':'MP4'}</span>}
     <button onClick={()=>void telaCheia()} aria-label={tr('Tela cheia','Fullscreen','Pantalla completa')} title={tr('Tela cheia (F)','Fullscreen (F)','Pantalla completa (F)')}><Icone nome="tela"/></button>
    </div>
   </div>
  </div>
  {sincronizacao&&<p className="player-keyboard-help">{sala.bloqueado?'O dono controla a reprodução e a posição.':'Seus controles sincronizam a sala.'}{sala.aguardaGesto&&<button className="button" onClick={sala.ativar}>Ativar reprodução sincronizada</button>}</p>}
  <p className="player-keyboard-help" id={ajudaId}>{tr('Com o player em foco: espaço ou K para pausar, ← → para voltar ou avançar 10 s, M para som e F para tela cheia.','With the player focused: Space or K to pause, ← → to seek 10 s, M for sound and F for fullscreen.','Con el reproductor enfocado: espacio o K para pausar, ← → para saltar 10 s, M para sonido y F para pantalla completa.')}</p>
 </div>;
}
