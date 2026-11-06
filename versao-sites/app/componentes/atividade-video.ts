'use client';
import {useEffect} from 'react';
/** O histórico público só usa esta informação quando a pessoa permite no perfil. */
export function useAtividadeVideo(usuarioId:string,episodioId:string|undefined,ativo=true){
 useEffect(()=>{
  if(!usuarioId||!episodioId||!ativo)return;
  const controle=new AbortController();let enviando=false;
  const registrar=async()=>{
   if(document.visibilityState==='hidden'||enviando)return;enviando=true;
   try{await fetch('/api/yokira',{method:'POST',signal:controle.signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({acao:'atividade-video',episodioId})});}
   catch{/* Falhas no registro opcional não interrompem o vídeo. */}finally{enviando=false;}
  };
  void registrar();const intervalo=setInterval(()=>void registrar(),45000);
  document.addEventListener('visibilitychange',registrar);
  return()=>{controle.abort();clearInterval(intervalo);document.removeEventListener('visibilitychange',registrar);};
 },[usuarioId,episodioId,ativo]);
}
