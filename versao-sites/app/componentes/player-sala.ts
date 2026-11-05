'use client';
import { useEffect, useRef, useState, type RefObject } from 'react';
import type { SincronizacaoPlayer } from '../../lib/salas';

/** Eventos remotos nunca publicam controles; somente o dono publica eventos locais. */
export function usePlayerSala(video:RefObject<HTMLVideoElement|null>,sincronizacao:SincronizacaoPlayer|undefined,url:string) {
 const atual=useRef(sincronizacao),gesto=useRef(false),aplicando=useRef(false),ultimo=useRef(-1),recebido=useRef(0);
 const [aguardaGesto,setAguardaGesto]=useState(false);
 useEffect(()=>{atual.current=sincronizacao;recebido.current=Date.now();},[sincronizacao]);
 useEffect(()=>{
  gesto.current=false;ultimo.current=-1;
  const v=video.current;if(!v)return;
  let liberacao:ReturnType<typeof setTimeout>|undefined;
  const publicar=()=>{
   const s=atual.current;
   if(!s?.dono||aplicando.current||!gesto.current||v.readyState<1)return;
   s.onControle(v.paused,v.currentTime,s.estado.revisao);
  };
  const aplicar=()=>{
   const s=atual.current;if(!s||v.readyState<1)return;
   if(s.dono&&ultimo.current>=0)return;
   if(s.dono&&gesto.current)return;
   const e=s.estado;
   // O relógio do cliente pode diferir do servidor: servidorEm é a referência recebida.
   const atraso=e.pausado?0:Math.max(0,(e.servidorEm-e.atualizadoEm+Date.now()-recebido.current)/1000);
   const alvo=Math.max(0,Math.min(Number.isFinite(v.duration)?v.duration:36000,e.posicao+atraso));
   aplicando.current=true;clearTimeout(liberacao);
   if(Math.abs(v.currentTime-alvo)>1.25)v.currentTime=alvo;
   v.playbackRate=1;
   if(e.pausado)v.pause();
   else if(gesto.current)void v.play().catch(()=>setAguardaGesto(true));
   else setAguardaGesto(true);
   ultimo.current=e.revisao;
   liberacao=setTimeout(()=>{aplicando.current=false;},400);
  };
  const metadados=()=>aplicar();
  v.addEventListener('play',publicar);v.addEventListener('pause',publicar);v.addEventListener('seeked',publicar);v.addEventListener('loadedmetadata',metadados);
  const intervalo=setInterval(aplicar,2000);
  return()=>{clearInterval(intervalo);clearTimeout(liberacao);v.removeEventListener('play',publicar);v.removeEventListener('pause',publicar);v.removeEventListener('seeked',publicar);v.removeEventListener('loadedmetadata',metadados);};
 },[video,url]);
 const ativar=()=>{
  gesto.current=true;setAguardaGesto(false);
  const v=video.current,s=atual.current;
  if(!v||!s)return;
  if(s.dono){aplicando.current=false;return;}
  aplicando.current=true;
  // Chamada síncrona dentro do gesto permite play em navegadores que bloqueiam autoplay.
  if(!s.estado.pausado)void v.play().catch(()=>setAguardaGesto(true));
 };
 return {ativar,aguardaGesto,bloqueado:!!sincronizacao&&!sincronizacao.dono};
}
