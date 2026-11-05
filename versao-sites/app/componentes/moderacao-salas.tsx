'use client';
import {useEffect,useState} from 'react';
type Mensagem={id:string;salaId:string;autorId:string;nome:string;corpo:string;oculto:boolean;criadoEm:number};
type Props={administrador:boolean;notificar:(mensagem:string)=>void};
export default function ModeracaoSalas({administrador,notificar}:Props){
 const [mensagens,setMensagens]=useState<Mensagem[]>([]),[erro,setErro]=useState(''),[busca,setBusca]=useState(''),[consulta,setConsulta]=useState('');
 const [versao,setVersao]=useState(0),[carregando,setCarregando]=useState(false),[enviando,setEnviando]=useState(false);
 const [selecionada,setSelecionada]=useState<Mensagem|null>(null),[motivo,setMotivo]=useState(''),[corpo,setCorpo]=useState(''),[editar,setEditar]=useState(false);
 useEffect(()=>{
  const controle=new AbortController();
  async function carregar(){
   setCarregando(true);setErro('');
   try{const r=await fetch('/api/yokira?acao=salas-moderacao&busca='+encodeURIComponent(consulta),{signal:controle.signal,cache:'no-store'});const dados=await r.json() as {mensagens:Mensagem[];erro?:string};if(!r.ok)throw new Error(dados.erro||'Não foi possível carregar as mensagens.');setMensagens(dados.mensagens);}
   catch(e){if(!controle.signal.aborted)setErro(e instanceof Error?e.message:'Não foi possível carregar as mensagens.');}
   finally{if(!controle.signal.aborted)setCarregando(false);}
  }
  void carregar();return()=>controle.abort();
 },[consulta,versao]);
 async function confirmar(evento:React.FormEvent){
  evento.preventDefault();if(!selecionada||enviando)return;setEnviando(true);setErro('');
  try{const r=await fetch('/api/yokira',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({acao:'moderar-mensagem-sala',id:selecionada.id,oculto:editar?selecionada.oculto:!selecionada.oculto,motivo,...(editar?{corpo}:{})})});const dados=await r.json() as {erro?:string};if(!r.ok)throw new Error(dados.erro||'Não foi possível alterar a mensagem.');setSelecionada(null);setVersao(v=>v+1);notificar('Mensagem moderada. Alteração registrada na auditoria.');}
  catch(e){setErro(e instanceof Error?e.message:'Não foi possível alterar a mensagem.');}
  finally{setEnviando(false);}
 }
 function preparar(m:Mensagem,edicao:boolean){setSelecionada(m);setMotivo('');setCorpo(m.corpo);setEditar(edicao);setErro('');}
 return <section className="administracao-lista" aria-labelledby="moderacao-salas-titulo"><h2 id="moderacao-salas-titulo">Mensagens das salas</h2><p className="administracao-ajuda">Acesso da equipe de moderação. Até 60 mensagens recentes; alterações exigem motivo e ficam na auditoria.</p>
  <form className="administracao-busca" onSubmit={e=>{e.preventDefault();setConsulta(busca.trim());setVersao(v=>v+1);}}><label>Buscar mensagem ou sala<input value={busca} onChange={e=>setBusca(e.target.value)} maxLength={100}/></label><button className="button" disabled={carregando}>Buscar</button></form>
  {erro&&<p role="alert" className="administracao-aviso">{erro}</p>}
  {selecionada&&<form className="administracao-confirmacao" onSubmit={e=>void confirmar(e)}><h3>{editar?'Editar mensagem':selecionada.oculto?'Restaurar mensagem':'Ocultar mensagem'}</h3>{editar?<label>Texto<textarea value={corpo} onChange={e=>setCorpo(e.target.value)} minLength={1} maxLength={1000} required disabled={enviando}/></label>:<p>{selecionada.corpo}</p>}<label>Motivo<textarea value={motivo} onChange={e=>setMotivo(e.target.value)} minLength={8} maxLength={500} required disabled={enviando}/></label><div className="administracao-acoes"><button className="button" type="button" disabled={enviando} onClick={()=>setSelecionada(null)}>Cancelar</button><button className="button button-primary" disabled={enviando||motivo.trim().length<8}>{enviando?'Salvando…':'Confirmar alteração'}</button></div></form>}
  {carregando?<p role="status">Carregando mensagens…</p>:mensagens.length?mensagens.map(m=><article className="administracao-item" key={m.id}><div className="administracao-item-corpo"><h3>{m.nome}</h3><p className="administracao-resumo">{m.corpo}</p><small>{new Date(m.criadoEm).toLocaleString('pt-BR')} · {m.oculto?'Oculta':'Visível'}</small><p className="administracao-identificador">Sala: {m.salaId}</p></div><div className="administracao-acoes">{administrador&&<button className="button" disabled={enviando} onClick={()=>preparar(m,true)}>Editar</button>}<button className="button" disabled={enviando} onClick={()=>preparar(m,false)}>{m.oculto?'Restaurar':'Ocultar'}</button></div></article>):<p>Nenhuma mensagem encontrada.</p>}
 </section>;
}
