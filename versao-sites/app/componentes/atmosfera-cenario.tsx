'use client';

import {useEffect,useRef} from 'react';

type Particula={x:number;y:number;tamanho:number;velocidade:number;fase:number};
const cores=['#f7a9d2','#a7c8fc','#fff2cc','#ffcd9b','#e5f3ff','#ffd48e','#7df6d1','#c6b2ff','#a4e9fa','#ffe6af'];
export default function AtmosferaCenario({indice}:{indice:number}) {
 const referencia=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const canvas=referencia.current;if(!canvas)return;
  const contexto=canvas.getContext('2d');if(!contexto)return;
  const reduzido=matchMedia('(prefers-reduced-motion: reduce)');
  let largura=0,altura=0,quadro=0,ultimo=0,passo=0,visivel=true,ativo=true;
  let particulas:Particula[]=[];
  const intensidade=()=>document.documentElement.dataset.efeitos||'intenso';
  function ajustar(){
   if(!canvas||!contexto||!ativo)return;
   const caixa=canvas.getBoundingClientRect();largura=caixa.width;altura=caixa.height;
   const escala=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(largura*escala);canvas.height=Math.round(altura*escala);contexto.setTransform(escala,0,0,escala,0,0);
   const quantidade=Math.round((largura<700?34:68)*(intensidade()==='suave'?.42:intensidade()==='equilibrado'?.7:1));
   particulas=Array.from({length:quantidade},()=>({x:Math.random()*largura,y:Math.random()*altura,tamanho:Math.random()*2.8+.7,velocidade:Math.random()*.8+.3,fase:Math.random()*Math.PI*2}));
  }
  function desenhar(tempo:number){
   if(!canvas||!contexto||!ativo)return;
   quadro=0;if(reduzido.matches||!visivel||document.visibilityState==='hidden')return;
   if(tempo-ultimo<32){quadro=requestAnimationFrame(desenhar);return;}
   const delta=Math.min((tempo-ultimo)/1000,.06);ultimo=tempo;passo+=delta;
   contexto.clearRect(0,0,largura,altura);contexto.fillStyle=cores[indice];contexto.strokeStyle=cores[indice];
   for(const p of particulas){
    const chuva=indice===1,bolha=indice===8,espirito=indice===6||indice===7;
    p.y+=(bolha?-1:1)*delta*(chuva?310:espirito?4:indice===4?24:15)*p.velocidade;
    p.x+=delta*(chuva?-65:12+Math.sin(passo*.7+p.fase)*18)*p.velocidade;
    if(p.y>altura+20)p.y=-20;if(p.y< -20)p.y=altura+20;if(p.x>largura+20)p.x=-20;if(p.x< -20)p.x=largura+20;
    contexto.globalAlpha=espirito?.3+Math.sin(passo*1.4+p.fase)*.25:chuva?.28:.48;
    contexto.beginPath();
    if(chuva){contexto.lineWidth=.7;contexto.moveTo(p.x,p.y);contexto.lineTo(p.x+3,p.y-17*p.velocidade);contexto.stroke();}
    else if(bolha){contexto.lineWidth=.7;contexto.arc(p.x,p.y,p.tamanho+1.5,0,Math.PI*2);contexto.stroke();}
    else if(indice===0){contexto.save();contexto.translate(p.x,p.y);contexto.rotate(passo*.45+p.fase);contexto.ellipse(0,0,p.tamanho*1.8,p.tamanho*.7,0,0,Math.PI*2);contexto.fill();contexto.restore();}
    else{contexto.arc(p.x,p.y,p.tamanho*(espirito?.65:.5),0,Math.PI*2);contexto.fill();if(espirito){contexto.globalAlpha*=.12;contexto.beginPath();contexto.arc(p.x,p.y,p.tamanho*3,0,Math.PI*2);contexto.fill();}}
   }
   contexto.globalAlpha=1;quadro=requestAnimationFrame(desenhar);
  }
  function sincronizar(){if(!ativo)return;cancelAnimationFrame(quadro);quadro=0;if(reduzido.matches){contexto?.clearRect(0,0,largura,altura);return;}if(visivel&&document.visibilityState==='visible'){ultimo=performance.now();quadro=requestAnimationFrame(desenhar);}}
  const tamanho=new ResizeObserver(ajustar);tamanho.observe(canvas);
  const area=new IntersectionObserver(entradas=>{visivel=entradas[0]?.isIntersecting??false;sincronizar();});area.observe(canvas);
  const preferencias=new MutationObserver(()=>{ajustar();sincronizar();});preferencias.observe(document.documentElement,{attributes:true,attributeFilter:['data-efeitos']});
  ajustar();sincronizar();reduzido.addEventListener('change',sincronizar);document.addEventListener('visibilitychange',sincronizar);
  return()=>{ativo=false;cancelAnimationFrame(quadro);tamanho.disconnect();area.disconnect();preferencias.disconnect();reduzido.removeEventListener('change',sincronizar);document.removeEventListener('visibilitychange',sincronizar);};
 },[indice]);
 return <canvas ref={referencia} className="cenario-atmosfera" aria-hidden="true"/>;
}
