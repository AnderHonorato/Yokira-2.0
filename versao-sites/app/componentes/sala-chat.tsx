'use client';
import {useState,useRef,useEffect,type FormEvent} from 'react';
import type {MensagemSala} from '../../lib/salas';
export default function SalaChat({mensagens,enviar,ocupado}:{mensagens:MensagemSala[];enviar:(corpo:string)=>Promise<void>;ocupado:boolean}) {
 const [corpo,setCorpo]=useState(''),[erro,setErro]=useState('');
 const lista=useRef<HTMLDivElement>(null),proximoFim=useRef(true);
 const ultima=mensagens.at(-1)?.id;
 useEffect(()=>{if(proximoFim.current&&lista.current)lista.current.scrollTop=lista.current.scrollHeight;},[ultima]);
 const publicar=async(e:FormEvent)=>{
  e.preventDefault();if(ocupado||!corpo.trim())return;
  try{setErro('');await enviar(corpo);setCorpo('');}catch(e){setErro(e instanceof Error?e.message:'Mensagem não enviada.');}
 };
 return <section className="sala-chat" aria-label="Conversa da sala">
  <h2>Conversa</h2><div className="sala-mensagens" ref={lista} role="log" aria-live="polite" aria-relevant="additions" onScroll={()=>{const el=lista.current;if(el)proximoFim.current=el.scrollHeight-el.scrollTop-el.clientHeight<80;}}>
   {!mensagens.length&&<p>As mensagens desta sala aparecem aqui.</p>}
   {mensagens.map(m=><article key={m.id}><div><strong>{m.nome}</strong><time dateTime={new Date(m.criadoEm).toISOString()}>{new Date(m.criadoEm).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</time></div><p>{m.corpo}</p></article>)}
  </div><form onSubmit={publicar}><label htmlFor="sala-mensagem">Mensagem</label><textarea id="sala-mensagem" value={corpo} maxLength={1000} rows={3} onChange={e=>setCorpo(e.target.value)} required/><small>{corpo.length}/1000</small><button className="button button-primary" disabled={ocupado||!corpo.trim()}>Enviar</button></form>{erro&&<p role="alert">{erro}</p>}
 </section>;
}
