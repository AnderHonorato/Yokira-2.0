'use client';

import { useEffect, useState } from 'react';
import AtmosferaCenario from './atmosfera-cenario';

export const CENARIOS_HERO = [
 '/arte/cenarios/01-sakura-luar.webp', '/arte/cenarios/02-metropole-chuva.webp',
 '/arte/cenarios/03-ilhas-celestes.webp', '/arte/cenarios/04-expresso-crepusculo.webp',
 '/arte/cenarios/05-templo-de-neve.webp', '/arte/cenarios/06-areias-do-destino.webp',
 '/arte/cenarios/07-floresta-espiritos.webp', '/arte/cenarios/08-observatorio-astral.webp',
 '/arte/cenarios/09-palacio-submerso.webp', '/arte/cenarios/10-dragoes-do-amanhecer.webp'
] as const;
export const NOMES_CENARIOS = ['Sakura ao luar','Metrópole sob chuva','Ilhas celestes','Expresso do crepúsculo','Templo de neve','Areias do destino','Floresta dos espíritos','Observatório astral','Palácio submerso','Dragões do amanhecer'] as const;

type Cena = {atual:number;anterior:number|null};
function Arte({indice}:{indice:number}) {
 const endereco=CENARIOS_HERO[indice];
 return <div className="cenario-ilustracao" data-cenario-src={endereco}><img src={endereco} alt="" decoding="async" fetchPriority="high" onError={evento=>{const imagem=evento.currentTarget;if(!imagem.dataset.fallback){imagem.dataset.fallback='true';imagem.src=endereco.replace('.webp','.svg');}}}/></div>;
}
export default function CenariosHero({indice=0}:{indice?:number}) {
 const seguro=Number.isInteger(indice)&&indice>=0&&indice<10?indice:0;
 const [cena,setCena]=useState<Cena>({atual:seguro,anterior:null});
 useEffect(()=>{
  if(cena.atual===seguro)return;
  let ativo=true;
  const imagem=new Image();
  const aplicar=()=>{if(ativo)setCena(antes=>antes.atual===seguro?antes:{atual:seguro,anterior:antes.atual});};
  imagem.onload=aplicar;imagem.onerror=aplicar;imagem.src=CENARIOS_HERO[seguro];
  return()=>{ativo=false;};
 },[seguro,cena.atual]);
 useEffect(()=>{
  if(cena.anterior===null)return;
  const tempo=setTimeout(()=>setCena(antes=>({...antes,anterior:null})),1800);
  return()=>clearTimeout(tempo);
 },[cena.anterior,cena.atual]);
 return <div className="intro-cenarios" aria-hidden="true" data-cenario-atual={cena.atual}>
  {cena.anterior!==null&&<div className="cenario-camada cenario-anterior" key={'anterior-'+cena.anterior}><Arte indice={cena.anterior}/></div>}
  <div className="cenario-camada cenario-atual" key={cena.atual}><Arte indice={cena.atual}/></div>
  <div className="cenario-aurora"/><div className="cenario-nevoa"/><div className="cenario-raios"/>
  <AtmosferaCenario indice={cena.atual}/>
 </div>;
}
