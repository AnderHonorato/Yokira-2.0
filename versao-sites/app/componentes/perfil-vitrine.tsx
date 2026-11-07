'use client';
import {useState,type CSSProperties,type ReactNode} from 'react';
import {LockKeyhole,ShieldCheck} from 'lucide-react';
import type {PerfilSocial} from '@/lib/social';
import {recompensaPerfil,visualDoPerfil} from '@/lib/personalizacao-perfil';
import {AvatarComunidade,AtividadeComunidade} from './cartao-perfil';
import {EmblemaNivel,perfilNivel} from './emblema-nivel';
import {useMovimentoVisivel} from './movimento-visivel';
import './perfil-ornamentos.css';
import './perfil-vitrine.css';

export type PropsPerfilVitrine={perfil:PerfilSocial;proprio?:boolean;acoes?:ReactNode;previa?:boolean};
/** A mesma vitrine representa o perfil próprio, sua prévia e a visita autorizada. */
export default function PerfilVitrine({perfil,acoes,previa=false}:PropsPerfilVitrine){
 const visual=visualDoPerfil(perfil),{referencia,ativo}=useMovimentoVisivel<HTMLElement>();
 const [falhou,setFalhou]=useState('');
 const imagem=visual.capa==='pessoal'?perfil.banner:recompensaPerfil('capa',visual.capa)?.imagem;
 const xp=Math.max(0,Number(perfil.xp)||0),nivel=Math.max(1,Number(perfil.nivel)||Math.floor(xp/100)+1),faixa=perfilNivel(nivel);
 const estilo={'--perfil-cor':faixa.cor,'--perfil-apoio':faixa.apoio} as CSSProperties;
 return <section ref={referencia} className="perfil-vitrine" aria-label={previa?'Prévia do perfil':`Perfil de ${perfil.nome}`} style={estilo}
  data-capa={visual.capa} data-moldura={visual.moldura} data-aura={visual.aura} data-animado={ativo}>
  <div className="perfil-vitrine-capa" aria-hidden="true">
   {imagem&&falhou!==imagem&&<img src={imagem} alt="" decoding="async" onError={()=>setFalhou(imagem)}/>}
   <span className="perfil-vitrine-grade"/><span className="perfil-vitrine-aurora"/>
   <span className="perfil-vitrine-particulas">{Array.from({length:12},(_,i)=><i key={i} style={{'--x':`${(i*31+8)%100}%`,'--y':`${(i*17+13)%85}%`,'--atraso':`${i*-.8}s`,'--duracao':`${5+i%4}s`} as CSSProperties}/>)}</span>
  </div>
  <div className="perfil-vitrine-faixa">{previa&&<span>Prévia</span>}<span>{perfil.publico?<ShieldCheck size={13} aria-hidden="true"/>:<LockKeyhole size={13} aria-hidden="true"/>}{perfil.publico?'Público':'Privado'}</span></div>
  <div className="perfil-vitrine-corpo">
   <div className="perfil-vitrine-identidade">
    <span className="perfil-retrato" data-moldura={visual.moldura} data-animado={ativo}><AvatarComunidade nome={perfil.nome} avatar={perfil.avatar}/><span className="perfil-retrato-selo" aria-hidden="true">{nivel}</span></span>
    <div className="perfil-vitrine-nome"><span className="perfil-vitrine-handle">@{perfil.handle}</span><h1>{perfil.nome}</h1></div>
    <div className="perfil-vitrine-nivel"><EmblemaNivel nivel={nivel} tamanho={52} marca/><div><strong>Nível {nivel}<small>{xp.toLocaleString('pt-BR')} XP</small></strong><progress value={xp%100} max={100} aria-label={`Progresso para o nível ${nivel+1}`}/><p>{faixa.nome} · {100-xp%100} XP para subir</p></div></div>
    {acoes&&<div className="perfil-vitrine-acoes">{acoes}</div>}
   </div>
   <div className="perfil-vitrine-detalhes">
    <div className="perfil-vitrine-biografia">{perfil.bio&&<p>{perfil.bio}</p>}<span>Na comunidade desde {new Date(perfil.criadoEm).toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</span>{!perfil.publico&&<small>Visível para você e suas amizades aceitas.</small>}</div>

   </div>
   {perfil.atividade&&<div className="perfil-vitrine-atividade"><AtividadeComunidade atividade={perfil.atividade}/></div>}
  </div>
 </section>;
}
