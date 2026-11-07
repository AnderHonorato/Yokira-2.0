'use client';
import {useId,type CSSProperties,type ReactNode} from 'react';
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
  <header className="vitrine-destaques-cabecalho"><div><h2 id={id}>Emblemas em destaque</h2><span>{itens.length}/3</span></div>{acoes}</header>
  <ol className="vitrine-destaques-podio">{itens.map((item,indice)=><li key={item.badgeId} className="vitrine-premio" data-raridade={item.raridade} style={{'--premio-cor':item.cor,'--premio-atraso':`${indice*-.6}s`} as CSSProperties}>
   <details className="vitrine-premio-detalhes"><summary><EmblemaConquista badgeId={item.badgeId} tamanho={56} animado/><span className="vitrine-premio-identidade"><strong>{item.titulo}</strong><small>{nomesRaridades[item.raridade]}</small></span></summary><div><p>{item.descricao}</p><time dateTime={new Date(item.obtidaEm!).toISOString()}>Obtida em {new Date(item.obtidaEm!).toLocaleDateString('pt-BR')}</time></div></details>
   {acoesItem?.(item,indice)}
  </li>)}</ol>
  {!itens.length&&<p className="vitrine-premio-ajuda">{proprio?'Escolha até três conquistas para destacar.':'Nenhum emblema em destaque.'}</p>}
 </section>;
}
