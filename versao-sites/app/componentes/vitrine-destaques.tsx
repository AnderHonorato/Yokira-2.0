'use client';
import {useId,type CSSProperties,type ReactNode} from 'react';
import {Award,Hexagon} from 'lucide-react';
import type {ConquistaProgresso} from '@/lib/conquistas';
import {nomesRaridades} from '@/lib/conquistas';
import {EmblemaConquista} from './emblema-conquista';
import {useMovimentoVisivel} from './movimento-visivel';
import './vitrine-destaques.css';

type Props={conquistas:ConquistaProgresso[];proprio?:boolean;acoes?:ReactNode;acoesItem?:(item:ConquistaProgresso,indice:number)=>ReactNode};
/** Exibe exclusivamente a ordem dos três prêmios equipados, nunca o inventário privado. */
export default function VitrineDestaques({conquistas,proprio=false,acoes,acoesItem}:Props){
 const itens=conquistas.filter(c=>c.obtidaEm!==null).slice(0,3),id=useId();
 const {referencia,ativo}=useMovimentoVisivel<HTMLElement>();
 return <section ref={referencia} className="social-destaques vitrine-destaques" data-animado={ativo} aria-labelledby={id}>
  <header className="vitrine-destaques-cabecalho"><div><span className="vitrine-destaques-legenda"><Award size={13} aria-hidden="true"/>CONQUISTAS EM DESTAQUE</span><h2 id={id}>Hall de conquistas</h2><p>{itens.length} de 3 espaços equipados</p></div>{acoes}</header>
  <ol className="vitrine-destaques-podio">{[0,1,2].map(indice=>{
   const item=itens[indice];
   return <li key={indice} className="vitrine-premio" data-raridade={item?.raridade||'comum'} data-vazio={!item} style={{'--premio-cor':item?.cor||'var(--accent)','--premio-atraso':`${indice*-.6}s`} as CSSProperties}>
    <span className="vitrine-premio-posicao">{String(indice+1).padStart(2,'0')}</span>
    <span className="vitrine-premio-estrelas" aria-hidden="true"><i/><i/><i/></span>
    <div className="vitrine-premio-palco">{item?<EmblemaConquista badgeId={item.badgeId} tamanho={112} animado/>:<span className="vitrine-premio-vazio" aria-hidden="true"><Hexagon size={56}/></span>}<span className="vitrine-premio-pedestal" aria-hidden="true"/></div>
    <div className="vitrine-premio-identidade"><span className="vitrine-premio-raridade">{item?nomesRaridades[item.raridade]:'Espaço livre'}</span><h3>{item?.titulo||`Destaque ${indice+1}`}</h3></div>
    {item&&acoesItem?.(item,indice)}
    {item?<details className="vitrine-premio-detalhes"><summary>Ver conquista</summary><p>{item.descricao}</p><time dateTime={new Date(item.obtidaEm!).toISOString()}>Obtida em {new Date(item.obtidaEm!).toLocaleDateString('pt-BR')}</time></details>:<p className="vitrine-premio-ajuda">{proprio?'Escolha uma conquista da sua coleção.':'Nenhum emblema equipado.'}</p>}
   </li>;
  })}</ol>
 </section>;
}
