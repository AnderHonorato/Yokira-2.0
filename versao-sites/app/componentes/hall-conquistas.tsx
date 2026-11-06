'use client';
import {useState,type CSSProperties} from 'react';
import {ArrowLeft,ArrowRight,Check,LockKeyhole,Pencil,X} from 'lucide-react';
import {nomesRaridades,type HallConquistas as PainelConquistas} from '@/lib/conquistas';
import EmblemaConquista from './emblema-conquista';
import VitrineDestaques from './vitrine-destaques';
import './hall-conquistas.css';

type Props={painel:PainelConquistas;onSalvar:(destaques:string[])=>Promise<void>};
export default function HallConquistas({painel,onSalvar}:Props){
 const [editando,setEditando]=useState(false),[selecao,setSelecao]=useState<string[]>([]),[salvando,setSalvando]=useState(false),[erro,setErro]=useState('');
 const [filtro,setFiltro]=useState('todas'),[raridade,setRaridade]=useState('');
 const destaques=editando?selecao:painel.destaques,obtidas=painel.conquistas.filter(c=>c.obtidaEm!==null).length;
 const escolhidas=destaques.flatMap(id=>painel.conquistas.filter(c=>c.badgeId===id));
 const itens=painel.conquistas.filter(c=>(filtro==='todas'||(filtro==='obtidas'?c.obtidaEm!==null:c.obtidaEm===null))&&(!raridade||c.raridade===raridade));
 function selecionar(id:string){
  setErro('');if(selecao.includes(id))setSelecao(selecao.filter(v=>v!==id));
  else if(selecao.length<3)setSelecao([...selecao,id]);else setErro('Seu hall tem três espaços. Remova um destaque para trocar.');
 }
 function mover(indice:number,direcao:number){
  const copia=[...selecao],outro=indice+direcao;if(outro<0||outro>=copia.length)return;
  [copia[indice],copia[outro]]=[copia[outro],copia[indice]];setSelecao(copia);
 }
 async function salvar(){
  if(salvando)return;setSalvando(true);setErro('');
  try{await onSalvar(selecao);setEditando(false);}catch(e){setErro(e instanceof Error?e.message:'Não foi possível salvar o hall. Tente novamente.');}finally{setSalvando(false);}
 }
 return <section className="hall-conquistas" aria-label="Minha coleção de conquistas">
  <VitrineDestaques conquistas={escolhidas} proprio acoes={!editando&&<button type="button" className="hall-acao" onClick={()=>{setSelecao([...painel.destaques]);setEditando(true);setErro('');}}><Pencil size={15}/>Editar destaques</button>}
   acoesItem={(item,indice)=>editando&&<div className="hall-ordem">
    <button type="button" disabled={salvando||indice===0} onClick={()=>mover(indice,-1)} aria-label={`Mover ${item.titulo} para antes`}><ArrowLeft size={16}/></button>
    <button type="button" disabled={salvando} onClick={()=>selecionar(item.badgeId)} aria-label={`Remover ${item.titulo} dos destaques`}><X size={16}/></button>
    <button type="button" disabled={salvando||indice===destaques.length-1} onClick={()=>mover(indice,1)} aria-label={`Mover ${item.titulo} para depois`}><ArrowRight size={16}/></button>
   </div>}/>
  {editando&&<div className="hall-edicao"><p>Escolha até três emblemas obtidos. Use as setas para definir a ordem pública.</p><button type="button" className="hall-acao" disabled={salvando} onClick={()=>{setEditando(false);setErro('');}}>Cancelar</button><button type="button" className="hall-acao hall-salvar" disabled={salvando} onClick={()=>void salvar()}>{salvando?'Salvando…':'Salvar destaques'}</button></div>}
  {erro&&<p className="hall-erro" role="alert">{erro}</p>}
  <section className="hall-inventario" aria-labelledby="hall-colecao-titulo"><header className="hall-cabecalho"><div><span className="hall-sobretitulo">CONQUISTAS DA CONTA</span><h2 id="hall-colecao-titulo">Minha coleção</h2><p>{obtidas} de {painel.conquistas.length} emblemas obtidos</p></div><div className="hall-total"><strong>{obtidas}<small>/{painel.conquistas.length}</small></strong><progress value={obtidas} max={painel.conquistas.length||1} aria-label="Progresso da coleção"/></div></header>
   <div className="hall-filtros"><div role="group" aria-label="Filtrar conquistas">{[['todas','Todas'],['obtidas','Obtidas'],['bloqueadas','A conquistar']].map(([id,nome])=><button key={id} type="button" aria-pressed={filtro===id} onClick={()=>setFiltro(id)}>{nome}</button>)}</div><label>Raridade<select value={raridade} onChange={e=>setRaridade(e.target.value)}><option value="">Todas</option>{Object.entries(nomesRaridades).map(([id,nome])=><option key={id} value={id}>{nome}</option>)}</select></label></div>
   <div className="hall-colecao">{itens.map(item=>{
    const ganhou=item.obtidaEm!==null,selecionado=destaques.includes(item.badgeId);
    return <article className="hall-cartao" key={item.badgeId} data-obtida={ganhou} data-raridade={item.raridade} style={{'--premio-cor':item.cor} as CSSProperties} aria-label={item.titulo}>
     <div className="hall-cartao-topo"><EmblemaConquista badgeId={item.badgeId} tamanho={76} animado={ganhou} rotulo={false}/><div className="hall-dados"><span className="hall-raridade">{nomesRaridades[item.raridade]} · {ganhou?'Obtida':'A conquistar'}</span><h3>{item.titulo}</h3>{selecionado&&<span className="hall-equipada"><Check size={11}/>Em destaque</span>}</div>
      {editando&&<button type="button" className="hall-selecionar" disabled={!ganhou||salvando} aria-pressed={selecionado} aria-label={`${selecionado?'Remover':'Destacar'} ${item.titulo}`} onClick={()=>selecionar(item.badgeId)}>{!ganhou?<LockKeyhole size={17}/>:selecionado?<Check size={17}/>:<span aria-hidden="true">+</span>}</button>}
     </div><p className="hall-descricao">{item.descricao}</p>
     {ganhou?<time className="hall-data" dateTime={new Date(item.obtidaEm!).toISOString()}>Obtida em {new Date(item.obtidaEm!).toLocaleDateString('pt-BR')}</time>:<div className="hall-progresso"><progress value={item.progresso} max={item.meta} aria-label={`${item.titulo}: ${item.progresso} de ${item.meta}`}/><small>{item.progresso} / {item.meta}</small></div>}
    </article>;
   })}</div>{!itens.length&&<p className="hall-sem-resultados">Nenhuma conquista neste filtro.</p>}
  </section>
 </section>;
}
