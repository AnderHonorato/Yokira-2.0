'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PainelAmizades, PessoaSocial } from '@/lib/social';
import { requisicaoSocial } from '@/lib/social-cliente';
import AcoesAmizade from './acoes-amizade';
import './social.css';
type Aba='amigos'|'recebidas'|'enviadas'|'bloqueados';
type Props = { abaInicial?:string; usuarioId: string; navegar?: (pagina: string, params?: Record<string,string>) => void };
export default function Amizades(props: Props) { return <Painel key={`${props.usuarioId}:${props.abaInicial||'amigos'}`} {...props}/>; }
function Painel({ navegar,abaInicial }: Props) {
 const [painel, setPainel] = useState<PainelAmizades | null>(null), [busca, setBusca] = useState(''), [termo, setTermo] = useState('');
 const [erro, setErro] = useState(''), [carregando, setCarregando] = useState(true), [aba, setAba] = useState<Aba>(['amigos','recebidas','enviadas','bloqueados'].includes(abaInicial||'')?abaInicial as Aba:'amigos');
 const vivo = useRef(true), versao = useRef(0);
 const carregar = useCallback(async () => {
  const atual=++versao.current;setCarregando(true);
  try {
   const r=await requisicaoSocial<PainelAmizades>({acao:'amizades',busca:termo});
   if(vivo.current && atual===versao.current){setPainel(r);setErro('');}
  }catch(e){if(vivo.current && atual===versao.current)setErro(e instanceof Error ? e.message:'Não foi possível carregar as amizades.');}
  finally{if(vivo.current && atual===versao.current)setCarregando(false);}
 },[termo]);
 useEffect(()=>{vivo.current=true;queueMicrotask(()=>{if(vivo.current)void carregar();});return()=>{vivo.current=false;};},[carregar]);
 function card(p:PessoaSocial){return <li key={p.id}><div className="social-pessoa"><span className="social-avatar pequeno" aria-hidden="true">{p.nome.slice(0,1).toUpperCase()}</span><div><button type="button" className="social-nome" disabled={!navegar || p.relacao==='bloqueado'} onClick={()=>navegar?.('perfil-publico',{handle:p.handle})}>{p.nome}</button><p>@{p.handle} · Nível {p.nivel}</p></div></div><AcoesAmizade pessoa={p} atualizar={carregar}/></li>;}
 const abas = [['amigos','Amizades'],['recebidas','Recebidas'],['enviadas','Enviadas'],['bloqueados','Bloqueados']] as const;
 return <section className="social-painel" aria-labelledby="amizades-titulo">
  <header><div><h1 id="amizades-titulo">Amizades</h1><p>Encontre pessoas pelo @ ou nome público e envie uma solicitação.</p></div></header>
  <form className="social-busca" onSubmit={e=>{e.preventDefault();setTermo(busca.trim());}}><label htmlFor="social-busca">Buscar pessoas</label><div><input id="social-busca" type="search" minLength={2} maxLength={60} value={busca} onChange={e=>setBusca(e.target.value)} placeholder="@identificador ou nome"/><button type="submit" disabled={carregando}>Buscar</button></div></form>
  {erro && <p role="alert" className="social-erro">{erro} <button type="button" onClick={()=>void carregar()}>Tentar novamente</button></p>}
  {carregando && <p role="status">Carregando amizades…</p>}
  {termo && painel && <div className="social-resultados"><h2>Resultados para “{termo}”</h2><p className="social-ajuda">Até 20 perfis públicos. A busca não usa emails.</p>{painel.resultados.length ? <ul className="social-lista">{painel.resultados.map(card)}</ul> : <p>Nenhum perfil encontrado.</p>}<button type="button" onClick={()=>{setBusca('');setTermo('');}}>Limpar busca</button></div>}
  <div className="social-abas" role="group" aria-label="Filtrar relações">{abas.map(([id,rotulo])=><button key={id} type="button" aria-pressed={aba===id} onClick={()=>setAba(id)}>{rotulo} <span>{painel?.[id].length || 0}</span></button>)}</div>
  {painel && <><h2>{abas.find(([id])=>id===aba)?.[1]}</h2>{painel[aba].length ? <ul className="social-lista">{painel[aba].map(card)}</ul> : <p className="social-vazio">{aba==='amigos' ? 'Suas amizades aceitas aparecerão aqui.' : aba==='recebidas' ? 'Nenhuma solicitação aguardando sua resposta.' : aba==='enviadas' ? 'Você não tem solicitações pendentes.' : 'Você não bloqueou ninguém.'}</p>}</>}
 </section>;
}
