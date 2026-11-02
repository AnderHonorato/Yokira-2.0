'use client';

import {useEffect,useRef,useState} from 'react';
import {situacoesColecao,type ItemColecao,type SituacaoColecao} from '@/lib/colecao';
import {textosColecao} from '@/lib/colecao-textos';
import type {Titulo} from './catalogo';
import {Icone} from './icones';
import './colecao.css';

type EstadoColecao={colecao?:ItemColecao[];minhaLista?:string[]};
type Props={catalogo:Titulo[];estado:EstadoColecao|null;usuario:unknown|null;idioma:string;editarId?:string;notificar:(mensagem:string)=>void;navegar:(pagina:string,params?:Record<string,string>)=>void;recarregar:()=>void|Promise<void>};
type Edicao={titulo:Titulo;situacao:SituacaoColecao;episodiosVistos:string;nota:string};

export default function Colecao({catalogo,estado,usuario,idioma,editarId,notificar,navegar,recarregar}:Props){
 const texto=textosColecao(idioma);
 const [filtro,setFiltro]=useState('todos');
 const [busca,setBusca]=useState('');
 const [ordem,setOrdem]=useState('recentes');
 const [edicao,setEdicao]=useState<Edicao|null>(null);
 const [ocupado,setOcupado]=useState<string|null>(null);
 const [erro,setErro]=useState('');
 const trava=useRef(false);
 const dialogo=useRef<HTMLDialogElement>(null);
 const aberto=useRef('');
 const itens=estado?.colecao??(estado?.minhaLista||[]).map(tituloId=>({tituloId,situacao:'planejado' as const,episodiosVistos:0,nota:null,criadoEm:'',atualizadoEm:''}));
 const localizar=(id:string)=>itens.find(item=>item.tituloId===id);

 function abrir(titulo:Titulo){
  const item=localizar(titulo.id);
  setErro('');
  setEdicao({titulo,situacao:item?.situacao||'planejado',episodiosVistos:String(item?.episodiosVistos||0),nota:item?.nota===null||item?.nota===undefined?'':String(item.nota)});
 }
 function fechar(){if(trava.current)return;setEdicao(null);setErro('');if(editarId)navegar('listas');}
 useEffect(()=>{
  if(edicao&&!dialogo.current?.open)dialogo.current?.showModal();
 },[edicao]);
 useEffect(()=>{
  if(!editarId){aberto.current='';return;}
  if(!usuario||!estado||aberto.current===editarId)return;
  const titulo=catalogo.find(item=>item.id===editarId);
  if(!titulo)return;
  aberto.current=editarId;
  const item=estado.colecao?.find(item=>item.tituloId===editarId);
  queueMicrotask(()=>setEdicao({titulo,situacao:item?.situacao||'planejado',episodiosVistos:String(item?.episodiosVistos||0),nota:item?.nota==null?'':String(item.nota)}));
 },[editarId,usuario,estado,catalogo]);

 async function enviar(payload:Record<string,unknown>){
  const response=await fetch('/api/yokira',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  const data=await response.json() as {erro?:string};
  if(!response.ok)throw new Error(data.erro||texto.erro);
  await recarregar();
 }
 async function salvar(){
  if(!edicao||trava.current)return;
  trava.current=true;setOcupado(edicao.titulo.id);setErro('');
  try{
   await enviar({acao:'acompanhamento',tituloId:edicao.titulo.id,situacao:edicao.situacao,episodiosVistos:Number(edicao.episodiosVistos),nota:edicao.nota?Number(edicao.nota):null});
   setEdicao(null);notificar(texto.salvo);if(editarId)navegar('listas');
  }catch(e){setErro(e instanceof Error?e.message:texto.erro);}
  finally{trava.current=false;setOcupado(null);}
 }
 async function proximo(titulo:Titulo,item:ItemColecao){
  if(trava.current)return;
  trava.current=true;setOcupado(titulo.id);
  const vistos=item.episodiosVistos+1;
  try{
   await enviar({acao:'acompanhamento',tituloId:titulo.id,situacao:titulo.episodios>0&&vistos===titulo.episodios?'concluido':'assistindo',episodiosVistos:vistos,nota:item.nota});
   notificar(texto.salvo);
  }catch(e){notificar(e instanceof Error?e.message:texto.erro);}
  finally{trava.current=false;setOcupado(null);}
 }
 async function remover(titulo:Titulo){
  if(trava.current)return;
  trava.current=true;setOcupado(titulo.id);
  try{await enviar({acao:'lista',tituloId:titulo.id,adicionado:false});notificar(texto.removido);}
  catch(e){notificar(e instanceof Error?e.message:texto.erroRemover);}
  finally{trava.current=false;setOcupado(null);}
 }

 if(!usuario)return <section className="colecao-entrada"><Icone nome="listas" tamanho={30}/><h2>{texto.entrar}</h2><p>{texto.entrarDescricao}</p><a className="button button-primary" href="/signin-with-chatgpt?return_to=%2F%3Fp%3Dlistas" target="_top">{texto.login}<Icone nome="seta" tamanho={16}/></a></section>;
 const resultados=itens.flatMap(item=>{const titulo=catalogo.find(t=>t.id===item.tituloId);return titulo?[{titulo,item}]:[];})
  .filter(({titulo,item})=>(filtro==='todos'||item.situacao===filtro)&&titulo.nome.toLocaleLowerCase().includes(busca.trim().toLocaleLowerCase()))
  .sort((a,b)=>ordem==='nome'?a.titulo.nome.localeCompare(b.titulo.nome):ordem==='nota'?(b.item.nota??-1)-(a.item.nota??-1):b.item.atualizadoEm.localeCompare(a.item.atualizadoEm));

 return <section className="colecao" aria-label={texto.resumo}>
  <div className="colecao-cabecalho"><div><h2>{texto.resumo}</h2><p>{texto.descricao}</p></div><button className="button" onClick={()=>navegar('catalogo')}>{texto.explorar}<Icone nome="seta" tamanho={15}/></button></div>
  <div className="colecao-filtros" role="group" aria-label={texto.filtro}>
   {(['todos',...situacoesColecao] as const).map(situacao=><button key={situacao} aria-pressed={filtro===situacao} className={filtro===situacao?'selecionado':''} onClick={()=>setFiltro(situacao)}>{texto[situacao]}<span>{situacao==='todos'?itens.length:itens.filter(i=>i.situacao===situacao).length}</span></button>)}
  </div>
  {itens.length>0&&<div className="colecao-ferramentas"><label><Icone nome="busca" tamanho={17}/><input aria-label={texto.busca} placeholder={texto.busca} value={busca} onChange={e=>setBusca(e.target.value)}/></label><select aria-label={texto.ordenar} value={ordem} onChange={e=>setOrdem(e.target.value)}><option value="recentes">{texto.recentes}</option><option value="nome">{texto.nome}</option><option value="nota">{texto.nota}</option></select></div>}
  {resultados.length?<div className="colecao-itens">{resultados.map(({titulo,item})=><article key={titulo.id} className="colecao-item" aria-busy={ocupado===titulo.id}>
   <button className="colecao-capa" onClick={()=>navegar('titulo',{id:titulo.id})} aria-label={`${texto.abrir}: ${titulo.nome}`}><img src={titulo.poster} alt="" loading="lazy" width="94" height="141"/></button>
   <div className="colecao-item-corpo"><span className={`colecao-situacao ${item.situacao}`}>{texto[item.situacao]}</span><h3><button onClick={()=>navegar('titulo',{id:titulo.id})}>{titulo.nome}</button></h3><div className="colecao-dados"><span>{item.episodiosVistos}{titulo.episodios>0?` / ${titulo.episodios}`:''} {texto.episodios.toLocaleLowerCase()}</span><span><Icone nome="estrela" tamanho={13}/>{item.nota===null?texto.semNota:`${item.nota} / 10`}</span></div>
    {titulo.episodios>0&&<progress aria-label={`${texto.progresso}: ${titulo.nome}`} max={titulo.episodios} value={item.episodiosVistos}/>}
    <div className="colecao-acoes"><button className="button" disabled={!!ocupado} onClick={()=>abrir(titulo)}>{texto.editar}</button>{item.situacao!=='concluido'&&item.episodiosVistos<(titulo.episodios||100000)&&<button className="colecao-proximo" disabled={!!ocupado} onClick={()=>void proximo(titulo,item)} aria-label={`${texto.visto}: ${titulo.nome}`}><Icone nome="mais" tamanho={15}/>1 ep.</button>}<button className="colecao-remover" disabled={!!ocupado} onClick={()=>void remover(titulo)} aria-label={`${texto.remover}: ${titulo.nome}`} title={texto.remover}><Icone nome="fechar" tamanho={16}/></button></div>
   </div>
  </article>)}</div>:<div className="colecao-vazia"><Icone nome={itens.length?'busca':'listas'} tamanho={32}/><h3>{itens.length?texto.semResultado:texto.vazio}</h3>{!itens.length&&<p>{texto.vazioDescricao}</p>}<button className="button" onClick={()=>{if(itens.length){setFiltro('todos');setBusca('');}else navegar('catalogo');}}>{itens.length?texto.limpar:texto.explorar}</button></div>}
  {edicao&&<dialog className="colecao-dialogo" ref={dialogo} aria-labelledby="colecao-editor-titulo" onCancel={e=>{e.preventDefault();fechar();}} onClick={e=>{if(e.target===e.currentTarget)fechar();}}><form onSubmit={e=>{e.preventDefault();void salvar();}} aria-busy={!!ocupado}>
   <div className="colecao-editor-topo"><span>{texto.editar}</span><button type="button" onClick={fechar} disabled={!!ocupado} aria-label={texto.fechar}><Icone nome="fechar"/></button></div>
   <h2 id="colecao-editor-titulo">{edicao.titulo.nome}</h2>
   <label htmlFor="colecao-situacao">{texto.situacao}</label><select autoFocus id="colecao-situacao" value={edicao.situacao} disabled={!!ocupado} onChange={e=>{const situacao=e.target.value as SituacaoColecao;setEdicao({...edicao,situacao,episodiosVistos:situacao==='concluido'&&edicao.titulo.episodios>0?String(edicao.titulo.episodios):edicao.episodiosVistos});}}>{situacoesColecao.map(s=><option key={s} value={s}>{texto[s]}</option>)}</select>
   <label htmlFor="colecao-vistos">{texto.episodios}</label><input id="colecao-vistos" type="number" inputMode="numeric" required min="0" max={edicao.titulo.episodios||100000} step="1" value={edicao.episodiosVistos} disabled={!!ocupado||(edicao.situacao==='concluido'&&edicao.titulo.episodios>0)} onChange={e=>setEdicao({...edicao,episodiosVistos:e.target.value})} aria-describedby="colecao-total"/>
   <p id="colecao-total" className="colecao-ajuda">{edicao.titulo.episodios>0?`${texto.total}: ${edicao.titulo.episodios}. ${texto.concluir}`:texto.semTotal}</p>
   <label htmlFor="colecao-nota">{texto.suaNota}</label><select id="colecao-nota" value={edicao.nota} disabled={!!ocupado} onChange={e=>setEdicao({...edicao,nota:e.target.value})} aria-describedby="colecao-nota-ajuda"><option value="">{texto.semNota}</option>{Array.from({length:10},(_,i)=>i+1).map(n=><option value={n} key={n}>{n} / 10</option>)}</select><p id="colecao-nota-ajuda" className="colecao-ajuda">{texto.dicaNota}</p>
   {erro&&<p className="colecao-erro" role="alert">{erro}</p>}
   <div className="colecao-editor-acoes"><button type="button" className="button" onClick={fechar} disabled={!!ocupado}>{texto.cancelar}</button><button className="button button-primary" disabled={!!ocupado}>{ocupado?texto.salvando:texto.salvar}</button></div>
  </form></dialog>}
 </section>;
}
