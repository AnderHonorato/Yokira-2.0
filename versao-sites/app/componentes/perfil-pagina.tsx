'use client';
import {useEffect,useState} from 'react';
import type {HallConquistas as PainelConquistas} from '@/lib/conquistas';
import PerfilSocial from './perfil-social';
import HallConquistas from './hall-conquistas';
import {EmblemaNivel,perfilNivel} from './emblema-nivel';
import AcessoConta,{sairConta} from './conta/acesso-conta';
import './perfil-pagina.css';

type Props={usuario:Record<string,unknown>|null;navegar:(pagina:string,params?:Record<string,string>)=>void;recarregar:()=>void|Promise<void>;notificar:(mensagem:string)=>void;retorno?:string;aoConectar?:()=>void};
export default function PerfilPagina(props:Props){
 const id=String(props.usuario?.id||'');
 return id?<PerfilAutenticado key={id} {...props} usuario={props.usuario!}/>:<section className="perfil-pagina"><header className="page-heading"><h1>Minha conta</h1></header><AcessoConta retorno={props.retorno} aoEntrar={()=>{void Promise.resolve(props.recarregar()).then(()=>props.aoConectar?.());}}/></section>;
}
function PerfilAutenticado({usuario,navegar,recarregar,notificar}:Props&{usuario:Record<string,unknown>}){
 const [painel,setPainel]=useState<PainelConquistas|null>(null),[erro,setErro]=useState(''),[versao,setVersao]=useState(0),[saindo,setSaindo]=useState(false);
 const xp=Math.max(0,Number(usuario.xp)||0),nivel=Math.floor(xp/100)+1,faixa=perfilNivel(nivel);
 const id=String(usuario.id),papel=String(usuario.papel||'membro');
 useEffect(()=>{
  const controle=new AbortController();
  void fetch('/api/yokira?acao=conquistas',{signal:controle.signal,cache:'no-store'}).then(async r=>{const dados=await r.json() as PainelConquistas&{erro?:string};if(!r.ok)throw new Error(dados.erro||'Não foi possível carregar as conquistas.');setPainel(dados);setErro('');}).catch(e=>{if(!controle.signal.aborted)setErro(e instanceof Error?e.message:'Não foi possível carregar as conquistas.');});
  return()=>controle.abort();
 },[id,versao]);
 async function salvarDestaques(destaques:string[]){
  const resposta=await fetch('/api/yokira',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({acao:'equipar-conquistas',destaques})});
  const dados=await resposta.json() as PainelConquistas&{erro?:string};if(!resposta.ok)throw new Error(dados.erro||'Não foi possível salvar o hall.');
  setPainel(dados);notificar('Emblemas em destaque atualizados.');
 }
 async function sair(){
  if(saindo)return;setSaindo(true);
  try{await sairConta();await recarregar();navegar('inicio');}
  catch(e){notificar(e instanceof Error?e.message:'Não foi possível sair da conta.');}
  finally{setSaindo(false);}
 }
 return <section className="perfil-pagina">
  <header className="perfil-resumo"><EmblemaNivel nivel={nivel} tamanho={124}/><div><h1>{String(usuario.nome||'Meu perfil')}</h1><p>Nível {nivel} · {faixa.nome}</p><span>{xp} XP</span><progress value={xp%100} max={100} aria-label={`Progresso para o nível ${nivel+1}`}/><small>{100-xp%100} XP para o nível {nivel+1}</small></div></header>
  {Boolean(usuario.suspenso)&&<p role="alert" className="perfil-erro">Sua conta está suspensa. Algumas ações estão indisponíveis.</p>}
  <nav className="perfil-atalhos" aria-label="Ações do perfil"><button className="button" onClick={()=>navegar('listas')}>Minha lista</button><button className="button" onClick={()=>navegar('amizades')}>Amizades</button><button className="button" onClick={()=>navegar('salas')}>Salas de exibição</button>{['moderador','administrador'].includes(papel)&&<button className="button" onClick={()=>navegar('admin')}>Administração</button>}{papel==='administrador'&&<button className="button" onClick={()=>navegar('acervo-admin')}>Editar catálogo</button>}</nav>
  <PerfilSocial usuarioId={id} aoSalvar={recarregar} navegar={navegar}/>
  {painel?<HallConquistas painel={painel} onSalvar={salvarDestaques}/>:<div className="perfil-hall-estado" aria-live="polite">{erro?<><p role="alert">{erro}</p><button className="button" onClick={()=>setVersao(v=>v+1)}>Tentar novamente</button></>:<p>Carregando conquistas…</p>}</div>}
  <div className="perfil-sessao">{id.startsWith('conta:')?<button className="button" disabled={saindo} onClick={()=>void sair()}>{saindo?'Saindo…':'Sair da conta'}</button>:<a className="button" href="/signout-with-chatgpt?return_to=%2F" target="_top">Sair da conta</a>}</div>
 </section>;
}
