'use client';
import {useCallback,useEffect,useState} from 'react';
import type {PerfilSocial as Perfil} from '@/lib/social';
import PerfilVitrine from './perfil-vitrine';
import type {HallConquistas as PainelConquistas} from '@/lib/conquistas';
import PerfilSocial from './perfil-social';
import HallConquistas from './hall-conquistas';
import AcessoConta,{sairConta} from './conta/acesso-conta';
import './perfil-pagina.css';

type Props={usuario:Record<string,unknown>|null;navegar:(pagina:string,params?:Record<string,string>)=>void;recarregar:()=>void|Promise<void>;notificar:(mensagem:string)=>void;retorno?:string;aoConectar?:()=>void};
export default function PerfilPagina(props:Props){
 const id=String(props.usuario?.id||'');
 return id?<PerfilAutenticado key={id} {...props} usuario={props.usuario!}/>:<section className="perfil-pagina"><header className="page-heading"><h1>Minha conta</h1></header><AcessoConta retorno={props.retorno} aoEntrar={()=>{void Promise.resolve(props.recarregar()).then(()=>props.aoConectar?.());}}/></section>;
}
function PerfilAutenticado({usuario,navegar,recarregar,notificar}:Props&{usuario:Record<string,unknown>}){
 const [painel,setPainel]=useState<PainelConquistas|null>(null),[erro,setErro]=useState(''),[versao,setVersao]=useState(0),[saindo,setSaindo]=useState(false);
 const [perfil,setPerfil]=useState<Perfil|null>(null),[previa,setPrevia]=useState<Perfil|null>(null),[aba,setAba]=useState<'hall'|'personalizar'>('hall');
 const receberPerfil=useCallback((p:Perfil)=>{setPerfil(p);setPrevia(p);},[]);
 const perfilExibido=aba==='personalizar'?(previa||perfil):perfil;
 const emPrevia=aba==='personalizar'&&JSON.stringify(previa)!==JSON.stringify(perfil);
 const id=String(usuario.id),papel=String(usuario.papel||'membro');
 useEffect(()=>{
  const controle=new AbortController();
  void fetch('/api/yokira?acao=conquistas',{signal:controle.signal,cache:'no-store'}).then(async r=>{const dados=await r.json() as PainelConquistas&{erro?:string};if(!r.ok)throw new Error(dados.erro||'Não foi possível carregar as conquistas.');setPainel(dados);setErro('');}).catch(e=>{if(!controle.signal.aborted)setErro(e instanceof Error?e.message:'Não foi possível carregar as conquistas.');});
  return()=>controle.abort();
 },[id,versao]);
 async function salvarDestaques(destaques:string[]){
  const resposta=await fetch('/api/yokira',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({acao:'equipar-conquistas',destaques})});
  const dados=await resposta.json() as PainelConquistas&{erro?:string};if(!resposta.ok)throw new Error(dados.erro||'Não foi possível salvar o hall.');
  setPainel(dados);
  const conquistas=destaques.flatMap(id=>dados.conquistas.filter(c=>c.badgeId===id));
  setPerfil(p=>p?{...p,conquistas}:p);setPrevia(p=>p?{...p,conquistas}:p);
  notificar('Emblemas em destaque atualizados.');
 }
 async function sair(){
  if(saindo)return;setSaindo(true);
  try{await sairConta();await recarregar();navegar('inicio');}
  catch(e){notificar(e instanceof Error?e.message:'Não foi possível sair da conta.');}
  finally{setSaindo(false);}
 }
 return <section className="perfil-pagina">
  {perfilExibido?<PerfilVitrine perfil={perfilExibido} proprio previa={emPrevia} acoes={<><button className="button button-primary" onClick={()=>setAba('personalizar')}>Personalizar perfil</button><button className="button" onClick={()=>navegar('perfil-publico',{handle:(perfil||perfilExibido).handle})}>Ver meu perfil público</button></>}/>:<header className="perfil-vitrine-esqueleto"><h1>Meu perfil</h1></header>}
  {Boolean(usuario.suspenso)&&<p role="alert" className="perfil-erro">Sua conta está suspensa. Algumas ações estão indisponíveis.</p>}
  <nav className="perfil-atalhos" aria-label="Ações do perfil"><button className="button" onClick={()=>navegar('listas')}>Minha lista</button><button className="button" onClick={()=>navegar('amizades')}>Amizades</button><button className="button" onClick={()=>navegar('salas')}>Salas de exibição</button>{['moderador','administrador'].includes(papel)&&<button className="button" onClick={()=>navegar('admin')}>Administração</button>}{papel==='administrador'&&<button className="button" onClick={()=>navegar('acervo-admin')}>Editar catálogo</button>}</nav>
  <nav className="perfil-secoes" aria-label="Seções do perfil"><button type="button" aria-pressed={aba==='hall'} onClick={()=>setAba('hall')}>Meu hall</button><button type="button" aria-pressed={aba==='personalizar'} onClick={()=>setAba('personalizar')}>Personalizar vitrine</button></nav>
  <div className="perfil-secao" hidden={!!perfil&&aba!=='personalizar'}><PerfilSocial usuarioId={id} aoSalvar={recarregar} navegar={navegar} aoPerfil={receberPerfil} aoPrevia={setPrevia}/></div>
  <div className="perfil-secao" hidden={aba!=='hall'}>
  {painel?<HallConquistas painel={painel} onSalvar={salvarDestaques}/>:<div className="perfil-hall-estado" aria-live="polite">{erro?<><p role="alert">{erro}</p><button className="button" onClick={()=>setVersao(v=>v+1)}>Tentar novamente</button></>:<p>Carregando conquistas…</p>}</div>}
  </div>
  <div className="perfil-sessao">{id.startsWith('conta:')?<button className="button" disabled={saindo} onClick={()=>void sair()}>{saindo?'Saindo…':'Sair da conta'}</button>:<a className="button" href="/signout-with-chatgpt?return_to=%2F" target="_top">Sair da conta</a>}</div>
 </section>;
}
