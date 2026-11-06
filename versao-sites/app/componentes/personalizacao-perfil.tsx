'use client';
import {useId,useState} from 'react';
import {Check,LockKeyhole,Sparkles} from 'lucide-react';
import {nomesRaridades} from '@/lib/conquistas';
import {type ItemInventarioPerfil,type TipoRecompensaPerfil,type VisualPerfil} from '@/lib/personalizacao-perfil';
import {useMovimentoVisivel} from './movimento-visivel';
import './personalizacao-perfil.css';

type Props={valor:VisualPerfil;inventario:ItemInventarioPerfil[];banner?:string;disabled?:boolean;aoMudar:(visual:VisualPerfil)=>void};
const categorias=[['capa','Capas'],['moldura','Molduras'],['aura','Auras']] as const;
export default function PersonalizacaoPerfil({valor,inventario,banner,disabled=false,aoMudar}:Props){
 const id=useId();
 const [tipo,setTipo]=useState<TipoRecompensaPerfil>('capa');
 const {referencia,ativo}=useMovimentoVisivel<HTMLDivElement>();
 const itens=inventario.filter(item=>item.tipo===tipo),liberadas=inventario.filter(item=>item.liberada).length;
 return <div ref={referencia} className="personalizacao-perfil" data-animado={ativo}>
  <header className="personalizacao-cabecalho"><div><span className="personalizacao-legenda"><Sparkles size={14}/>PERSONALIZAÇÃO</span><h3>Personalizar vitrine</h3><p>Equipe as recompensas que conquistou. As alterações aparecem na prévia antes de salvar.</p></div><span className="personalizacao-contagem">{liberadas}/{inventario.length}<small>liberadas</small></span></header>
  <div className="personalizacao-abas" role="group" aria-label="Tipo de recompensa">{categorias.map(([id,nome])=><button key={id} type="button" aria-pressed={tipo===id} onClick={()=>setTipo(id)}>{nome}<span>{inventario.filter(item=>item.tipo===id&&item.liberada).length}</span></button>)}</div>
  <div className="personalizacao-grade">{itens.map(item=>{
   const pessoal=item.id==='pessoal',disponivel=pessoal?!!banner:item.liberada,selecionada=valor[tipo]===item.id;
   return <button key={item.id} type="button" className="personalizacao-item" data-tipo={tipo} data-item={item.id} data-raridade={item.raridade} data-liberada={disponivel} aria-describedby={`${id}-${item.tipo}-${item.id}`} aria-pressed={selecionada} disabled={disabled||!disponivel} onClick={()=>aoMudar({...valor,[tipo]:item.id})} aria-label={`${item.nome}${selecionada?', equipada':''}${!disponivel?', bloqueada':''}`}>
    <span className="personalizacao-amostra" aria-hidden="true">{item.imagem||pessoal&&banner?<img src={pessoal?banner:item.imagem} alt="" loading="lazy"/>:<span className={`personalizacao-amostra-${tipo}`}/>}<i/>{selecionada?<Check size={18}/>:!disponivel?<LockKeyhole size={16}/>:null}</span>
    <span className="personalizacao-item-info"><span className="personalizacao-raridade">{nomesRaridades[item.raridade]}{selecionada?' · Equipada':''}</span><strong>{item.nome}</strong><span id={`${id}-${item.tipo}-${item.id}`}>{pessoal&&!banner?'Envie uma imagem na seção abaixo.':!disponivel?item.descricao:'Disponível para equipar'}</span></span>
   </button>;
  })}</div>
  <p className="personalizacao-nota">Capas e efeitos personalizam apenas seu perfil. O fundo do site continua definido pela administração.</p>
 </div>;
}
