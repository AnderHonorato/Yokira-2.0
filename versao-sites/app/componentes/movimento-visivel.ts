'use client';
import {useEffect,useRef,useState} from 'react';

/** Movimento decorativo só consome quadros quando pode ser visto. */
export function useMovimentoVisivel<T extends Element>(habilitado=true){
 const referencia=useRef<T>(null),[visivel,setVisivel]=useState(false);
 useEffect(()=>{
  const elemento=referencia.current;if(!elemento||!habilitado)return;
  const preferencia=window.matchMedia('(prefers-reduced-motion: reduce)');
  let naTela=false,ativo=true;
  const atualizar=()=>{if(ativo)setVisivel(naTela&&!preferencia.matches&&document.visibilityState==='visible');};
  const observador=new IntersectionObserver(([entrada])=>{naTela=entrada.isIntersecting;atualizar();});
  observador.observe(elemento);
  preferencia.addEventListener('change',atualizar);document.addEventListener('visibilitychange',atualizar);
  return()=>{ativo=false;observador.disconnect();preferencia.removeEventListener('change',atualizar);document.removeEventListener('visibilitychange',atualizar);};
 },[habilitado]);
 return {referencia,ativo:habilitado&&visivel};
}
