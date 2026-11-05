'use client';

import {useEffect,useId,useRef,useState} from 'react';
import Celebracao from './celebracao';

export default function PreviaCelebracao(){
 const [tipo,setTipo]=useState<'nivel'|'conquista'|null>(null);
 const dialogo=useRef<HTMLDialogElement>(null);const titulo=useId();
 useEffect(()=>{if(tipo)dialogo.current?.showModal();else dialogo.current?.close();},[tipo]);
 const fechar=()=>setTipo(null);
 return <div className="aparencia-previas"><h3>Experimentar as celebrações</h3><p className="administracao-ajuda">Prévia visual: não concede XP, não cria notificações e não repete conquistas já recebidas.</p>
  <div><button className="button" type="button" onClick={()=>setTipo('conquista')}>Prévia de conquista</button><button className="button" type="button" onClick={()=>setTipo('nivel')}>Prévia de subida de nível</button></div>
  <dialog ref={dialogo} className={`notificacoes-celebracao ${tipo||''}`} aria-labelledby={titulo} onCancel={evento=>{evento.preventDefault();fechar();}} onClick={evento=>{if(evento.target===evento.currentTarget)fechar();}}>
   {tipo&&<Celebracao key={tipo} idTitulo={titulo} evento={{id:'previa-'+tipo,tipo,titulo:tipo==='nivel'?'Nível 10 alcançado':'Uma nova conquista',descricao:'Um novo capítulo da sua jornada no universo Yokira.',destino:'/?p=perfil',criadoEm:0,lidaEm:null,celebradaEm:null}} fechar={fechar} continuar={fechar} origem={fechar}/>}
  </dialog>
 </div>;
}
