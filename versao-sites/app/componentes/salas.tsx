'use client';
import {useEffect,useState,type FormEvent} from 'react';
import type {Anime} from '../../lib/catalogo';
import type {SalaResumo} from '../../lib/salas';
import {apiSala} from './salas-api';
import './salas.css';

type Episodio={id:string;titulo:string;numero:number;temporadaId:string|null};
type Props={titulos:Anime[];onAbrirSala:(id:string)=>void;conviteInicial?:string};
export default function Salas({titulos,onAbrirSala,conviteInicial=''}:Props) {
 const [salas,setSalas]=useState<SalaResumo[]>([]),[erro,setErro]=useState(''),[carregando,setCarregando]=useState(true),[ocupado,setOcupado]=useState(false),[aviso,setAviso]=useState('');
 const [tituloId,setTituloId]=useState(titulos[0]?.id||''),[episodios,setEpisodios]=useState<Episodio[]>([]),[episodioId,setEpisodioId]=useState('');
 const [modo,setModo]=useState('dupla'),[convite,setConvite]=useState(conviteInicial),[carregandoEpisodios,setCarregandoEpisodios]=useState(false);
 useEffect(()=>{
  const abort=new AbortController();
  apiSala<{salas:SalaResumo[]}>('salas',undefined,abort.signal).then(d=>setSalas(d.salas)).catch(e=>{if(!abort.signal.aborted)setErro(e.message);}).finally(()=>{if(!abort.signal.aborted)setCarregando(false);});
  return()=>abort.abort();
 },[]);
 useEffect(()=>{
  const abort=new AbortController();
  void fetch(`/api/yokira?${new URLSearchParams({acao:'episodios',tituloId})}`,{signal:abort.signal}).then(async r=>{const d=await r.json() as {erro?:string;episodios:Episodio[]};if(!r.ok)throw new Error(d.erro||'Vídeos indisponíveis.');return d;}).then(d=>{setEpisodios(d.episodios);setEpisodioId(d.episodios[0]?.id||'');}).catch(e=>{if(!abort.signal.aborted){setEpisodios([]);setEpisodioId('');setErro(e.message);}}).finally(()=>{if(!abort.signal.aborted)setCarregandoEpisodios(false);});
  return()=>abort.abort();
 },[tituloId]);
 const executar=async(e:FormEvent,acao:string,dados:Record<string,unknown>)=>{
  e.preventDefault();if(ocupado)return;setOcupado(true);setErro('');
  try{const d=await apiSala<{salaId:string}>(acao,dados);onAbrirSala(d.salaId);}catch(e){setErro(e instanceof Error?e.message:'Não foi possível abrir a sala.');}finally{setOcupado(false);}
 };
 const encerrarSala=async(salaId:string)=>{
  if(ocupado)return;setOcupado(true);setErro('');setAviso('');
  try{await apiSala('sala-encerrar',{salaId});setSalas(antes=>antes.filter(s=>s.id!==salaId));setAviso('Sala encerrada. O convite não permite novas entradas.');}
  catch(e){setErro(e instanceof Error?e.message:'Não foi possível encerrar a sala.');}
  finally{setOcupado(false);}
 };
 const mudarTitulo=(id:string)=>{setTituloId(id);setEpisodios([]);setEpisodioId('');setCarregandoEpisodios(true);setErro('');};
 return <section className="salas-pagina"><header><span className="eyebrow">Assista junto</span><h1>Salas</h1><p>Crie uma sala privada em dupla ou em grupo e converse durante o vídeo.</p></header>
  {erro&&<p className="sala-erro" role="alert">{erro}</p>}{aviso&&<p role="status">{aviso}</p>}
  <div className="salas-formularios"><form onSubmit={e=>void executar(e,'sala-criar',{tituloId,episodioId,modo})}><h2>Criar sala</h2><label htmlFor="sala-titulo">Título</label><select id="sala-titulo" value={tituloId} onChange={e=>mudarTitulo(e.target.value)} required>{titulos.map(t=><option key={t.id} value={t.id}>{t.nome}</option>)}</select>
   <label htmlFor="sala-episodio">Episódio ou filme</label><select id="sala-episodio" value={episodioId} onChange={e=>setEpisodioId(e.target.value)} required disabled={carregandoEpisodios||!episodios.length}>{!episodios.length&&<option value="">{carregandoEpisodios?'Carregando vídeos…':'Sem vídeos publicados'}</option>}{episodios.map(ep=><option value={ep.id} key={ep.id}>{ep.numero}. {ep.titulo}</option>)}</select>
   <label htmlFor="sala-modo">Participantes</label><select id="sala-modo" value={modo} onChange={e=>setModo(e.target.value)}><option value="dupla">Dupla · até 2 pessoas</option><option value="grupo">Grupo · até 12 pessoas</option></select><button className="button button-primary" disabled={ocupado||!episodioId||carregandoEpisodios}>Criar sala privada</button></form>
   <form onSubmit={e=>void executar(e,'sala-entrar',{convite:convite.trim()})}><h2>Entrar com convite</h2><label htmlFor="sala-codigo">Código privado</label><input id="sala-codigo" value={convite} onChange={e=>setConvite(e.target.value)} autoComplete="off" maxLength={64} minLength={64} required/><p>Peça o código ao dono da sala.</p><button className="button" disabled={ocupado||convite.trim().length!==64}>Entrar na sala</button></form></div>
  <section className="salas-lista"><h2>Suas salas</h2>{carregando?<p role="status">Carregando salas…</p>:!salas.length?<p>Você ainda não participa de uma sala ativa.</p>:<ul>{salas.map(s=><li key={s.id}><div><strong>{titulos.find(t=>t.id===s.tituloId)?.nome||'Sala privada'}</strong><p>{s.modo==='dupla'?'Dupla':'Grupo'} · {s.participantes}/{s.modo==='dupla'?2:12} pessoas</p><span className={`sala-status${s.trancada?' sala-status-trancada':''}`}>{s.disponivel===false?'Conteúdo indisponível':s.trancada?'Sala trancada':'Sala aberta'}</span></div><div className="salas-item-acoes">{s.disponivel!==false&&<button className="button" disabled={ocupado} onClick={()=>onAbrirSala(s.id)}>Abrir sala</button>}{s.propria&&<button className="button" disabled={ocupado} onClick={()=>void encerrarSala(s.id)}>Encerrar sala</button>}</div></li>)}</ul>}</section>
 </section>;
}
