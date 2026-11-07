'use client';

import {useEffect,useId,useRef,useState} from 'react';
import Celebracao from './celebracao';
import { conquistas } from '@/lib/conquistas';
import './previa-celebracao.css';

export default function PreviaCelebracao(){
 const [tipo,setTipo]=useState<'nivel'|'conquista'|null>(null);
 const [nivel,setNivel]=useState(2), [badgeId,setBadgeId]=useState('boas-vindas');
 const dialogo=useRef<HTMLDialogElement>(null);const titulo=useId();
 const conquista=conquistas.find(item=>item.badgeId===badgeId)!;
 useEffect(()=>{if(tipo)dialogo.current?.showModal();else dialogo.current?.close();},[tipo]);
 const fechar=()=>setTipo(null);
 return <div className="aparencia-previas"><h3>Experimentar as celebrações</h3><p className="administracao-ajuda">Prévia visual: não concede XP, não cria notificações e não repete conquistas já recebidas.</p>
  <div className="celebracao-previa-opcoes"><label>Nível<select value={nivel} onChange={e=>setNivel(Number(e.target.value))}>{[1,2,3,4,5,10,20,35,50,75,100,150].map(valor=><option value={valor} key={valor}>{valor}</option>)}</select></label><label>Conquista<select value={badgeId} onChange={e=>setBadgeId(e.target.value)}>{conquistas.map(item=><option value={item.badgeId} key={item.badgeId}>{item.titulo}</option>)}</select></label></div>
  <div><button className="button" type="button" onClick={()=>setTipo('conquista')}>Prévia de conquista</button><button className="button" type="button" onClick={()=>setTipo('nivel')}>Prévia de subida de nível</button></div>
  <dialog ref={dialogo} className={`notificacoes-celebracao ${tipo||''}`} aria-labelledby={titulo} onCancel={evento=>{evento.preventDefault();fechar();}} onClick={evento=>{if(evento.target===evento.currentTarget)fechar();}}>
   {tipo&&<Celebracao key={`${tipo}-${nivel}-${badgeId}`} idTitulo={titulo} evento={{id:'previa-'+tipo,tipo,badgeId:tipo==='conquista'?badgeId:null,titulo:tipo==='nivel'?`Nível ${nivel} alcançado`:conquista.titulo,descricao:tipo==='nivel'?'Sua participação fez você avançar para um novo nível.':conquista.descricao,destino:'/?p=perfil',criadoEm:0,lidaEm:null,celebradaEm:null}} fechar={fechar} continuar={fechar} origem={fechar}/>}
  </dialog>
 </div>;
}
