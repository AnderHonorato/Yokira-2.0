'use client';
import {useEffect,useId,useRef,useState} from 'react';
import './marca-animada.css';

/** A arte original permanece intacta; somente a região da cobra recebe movimento. */
export function MarcaAnimada({tamanho=52}:{tamanho?:number}){
 const id=useId().replace(/:/g,''),raiz=useRef<SVGSVGElement>(null);
 const [animar,setAnimar]=useState(false);
 useEffect(()=>{
  const midia=window.matchMedia('(prefers-reduced-motion: reduce)');let naTela=true;
  const atualizar=()=>setAnimar(naTela&&!midia.matches&&document.visibilityState==='visible');
  const observador=new IntersectionObserver(([entrada])=>{naTela=entrada.isIntersecting;atualizar();});
  if(raiz.current)observador.observe(raiz.current);
  atualizar();midia.addEventListener('change',atualizar);document.addEventListener('visibilitychange',atualizar);
  return()=>{observador.disconnect();midia.removeEventListener('change',atualizar);document.removeEventListener('visibilitychange',atualizar);};
 },[]);
 const recorte='M71 15C101-5 159-2 172 43L180 78 154 102 124 96 98 80 82 63 95 45 79 31Z';
 const cabeca='M109 50C127 46 160 54 176 73L170 96 150 103 125 92 111 77Z';
 const arte=<image href="/marca/emblema-192.png" width="192" height="192"/>;
 return <svg ref={raiz} className="marca-animada" data-original="/marca/emblema-192.png" data-animado={animar} width={tamanho} height={tamanho} viewBox="0 0 192 192" aria-hidden="true" focusable="false">
  <defs>
   <clipPath id={`${id}-cobra`}><path d={recorte}/></clipPath>
   <clipPath id={`${id}-cabeca`}><path d={cabeca}/></clipPath>
   <mask id={`${id}-corpo`}><rect width="192" height="192" fill="white"/><path d={cabeca} fill="black"/></mask>
   <mask id={`${id}-fixo`}><rect width="192" height="192" fill="white"/><path d={recorte} fill="black"/></mask>
   <filter id={`${id}-movimento`} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency=".025 .018" numOctaves="1" seed="4" result="onda">
     {animar&&<animate attributeName="baseFrequency" values=".025 .018;.019 .026;.025 .018" dur="6s" repeatCount="indefinite"/>}
    </feTurbulence>
    <feDisplacementMap in="SourceGraphic" in2="onda" scale={animar?10:0} xChannelSelector="R" yChannelSelector="G"/>
   </filter>
  </defs>
  <g mask={`url(#${id}-fixo)`}>{arte}</g>
  <g clipPath={`url(#${id}-cobra)`}><g mask={`url(#${id}-corpo)`}><g className="marca-cobra-original" filter={`url(#${id}-movimento)`}>{arte}</g></g><g clipPath={`url(#${id}-cabeca)`}><g className="marca-cabeca-original">{arte}</g></g></g>
 </svg>;
}
