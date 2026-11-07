'use client';
import {useEffect,useState} from 'react';
import {artesBanners,type BannerConfig,type BannersAdminDTO} from '@/lib/banners';
import {EnviarMidia} from './enviar-midia';
import {useEnviosMidia} from './envios-midia';
import './banners-admin.css';
type Edicao=Omit<BannerConfig,'atualizadoEm'|'id'>&{id?:string};
type Props={notificar:(mensagem:string)=>void};
const vazio:Edicao={tituloId:'2',imagem:'/arte/banners/one-piece-cenario.webp',personagem:'/arte/banners/one-piece-personagem.webp',link:'',intervaloSegundos:null,ordem:0,ativo:true};
async function executar(dados:Record<string,unknown>){
 const resposta=await fetch('/api/yokira',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(dados)});
 const retorno=await resposta.json() as {erro?:string};if(!resposta.ok)throw new Error(retorno.erro||'Não foi possível atualizar os banners.');
 window.dispatchEvent(new Event('yokira:banners'));
}
export default function BannersAdmin({notificar}:Props){
 const envios=useEnviosMidia();
 const [dados,setDados]=useState<BannersAdminDTO|null>(null),[edicao,setEdicao]=useState<Edicao|null>(null),[motivo,setMotivo]=useState('');
 const [padrao,setPadrao]=useState(8),[motivoPadrao,setMotivoPadrao]=useState(''),[erro,setErro]=useState(''),[ocupado,setOcupado]=useState(false),[versao,setVersao]=useState(0);
 useEffect(()=>{
  const controle=new AbortController();
  void fetch('/api/yokira?acao=banners-admin',{signal:controle.signal,cache:'no-store'}).then(async r=>{const d=await r.json() as BannersAdminDTO&{erro?:string};if(!r.ok)throw new Error(d.erro||'Não foi possível carregar os banners.');setDados(d);setPadrao(d.intervaloPadraoSegundos);setErro('');}).catch(e=>{if(!controle.signal.aborted)setErro(e instanceof Error?e.message:'Falha ao carregar os banners.');});
  return()=>controle.abort();
 },[versao]);
 async function salvar(evento:React.FormEvent){
  evento.preventDefault();if(!edicao||ocupado||envios.temEnvios())return;setOcupado(true);setErro('');
  try{const {id,...campos}=edicao;await executar({acao:'salvar-banner',...campos,...(id?{id}:{}),motivo});setEdicao(null);setMotivo('');setVersao(v=>v+1);notificar('Banner atualizado.');}
  catch(e){setErro(e instanceof Error?e.message:'Não foi possível salvar.');}finally{setOcupado(false);}
 }
 async function tempo(evento:React.FormEvent){
  evento.preventDefault();if(ocupado||envios.temEnvios())return;setOcupado(true);setErro('');
  try{await executar({acao:'configurar-banners',intervaloPadraoSegundos:padrao,motivo:motivoPadrao});setMotivoPadrao('');setVersao(v=>v+1);notificar('Tempo padrão atualizado.');}
  catch(e){setErro(e instanceof Error?e.message:'Não foi possível salvar.');}finally{setOcupado(false);}
 }
 const bloqueado=ocupado||envios.ocupado;
 return <section className="banners-admin" aria-labelledby="banners-admin-titulo"><header><h2 id="banners-admin-titulo">Banners da página inicial</h2><p>Defina as imagens, os personagens e o tempo de cada destaque para todos os visitantes.</p></header>
  {erro&&<p className="administracao-aviso" role="alert">{erro}</p>}
  {!dados?<><p role="status">{erro?'Os banners não foram carregados.':'Carregando banners…'}</p>{erro&&<button className="button" onClick={()=>setVersao(v=>v+1)}>Tentar novamente</button>}</>:<>
   <form className="banners-configuracao" onSubmit={e=>void tempo(e)}><label>Tempo padrão em segundos<input type="number" min={3} max={60} required value={padrao} disabled={bloqueado} onChange={e=>setPadrao(Number(e.target.value))}/></label><label>Motivo<input required minLength={3} maxLength={500} value={motivoPadrao} disabled={bloqueado} onChange={e=>setMotivoPadrao(e.target.value)}/></label><button className="button" disabled={bloqueado}>Salvar tempo padrão</button></form>
   <button className="button button-primary" disabled={bloqueado} onClick={()=>{setEdicao({...vazio,ordem:dados.banners.length});setMotivo('');}}>Criar banner</button>
   {edicao&&<form key={edicao.id||'novo'} className="banners-editor" onSubmit={e=>void salvar(e)} aria-labelledby="banners-editor-titulo"><h3 id="banners-editor-titulo">{edicao.id?'Editar banner':'Novo banner'}</h3>
    <label>Arte pronta<select value="" disabled={bloqueado} onChange={e=>{const arte=artesBanners.find(a=>a.arquivo===e.target.value);if(arte)setEdicao({...edicao,tituloId:arte.tituloId,imagem:`/arte/banners/${arte.arquivo}-cenario.webp`,personagem:`/arte/banners/${arte.arquivo}-personagem.webp`});}}><option value="">Escolher arte</option>{artesBanners.map(a=><option key={a.arquivo} value={a.arquivo}>{a.nome}</option>)}</select></label>
    <label>Título relacionado<select value={edicao.tituloId} disabled={bloqueado} onChange={e=>setEdicao({...edicao,tituloId:e.target.value})}>{dados.catalogo.map(t=><option key={t.id} value={t.id}>{t.nome}{t.oculto?' · oculto':''}</option>)}</select></label>
    <label>Imagem do cenário<input value={edicao.imagem} maxLength={1500} required disabled={bloqueado} onChange={e=>setEdicao({...edicao,imagem:e.target.value})}/></label><EnviarMidia identidade={(edicao.id||'novo')+':cenario'} tipo="imagem" disabled={bloqueado} onOcupado={valor=>envios.ocupar('cenario',valor)} onEnviado={url=>setEdicao(anterior=>anterior?{...anterior,imagem:url}:null)}/>
    <label>Personagem em camada separada (opcional)<input value={edicao.personagem} maxLength={1500} disabled={bloqueado} onChange={e=>setEdicao({...edicao,personagem:e.target.value})}/></label><p>Use PNG ou WebP com transparência para o personagem.</p><EnviarMidia identidade={(edicao.id||'novo')+':personagem'} tipo="imagem" disabled={bloqueado} onOcupado={valor=>envios.ocupar('personagem',valor)} onEnviado={url=>setEdicao(anterior=>anterior?{...anterior,personagem:url}:null)}/>
    <label>Link adicional (opcional)<input value={edicao.link} maxLength={1500} disabled={bloqueado} onChange={e=>setEdicao({...edicao,link:e.target.value})}/></label>
    <div className="banners-campos"><label>Tempo deste banner em segundos<input type="number" min={3} max={60} value={edicao.intervaloSegundos??''} placeholder={`Padrão: ${padrao}s`} disabled={bloqueado} onChange={e=>setEdicao({...edicao,intervaloSegundos:e.target.value===''?null:Number(e.target.value)})}/></label><label>Ordem<input type="number" min={0} max={999} required value={edicao.ordem} disabled={bloqueado} onChange={e=>setEdicao({...edicao,ordem:Number(e.target.value)})}/></label></div>
    <label className="banners-ativo"><input type="checkbox" checked={edicao.ativo} disabled={bloqueado} onChange={e=>setEdicao({...edicao,ativo:e.target.checked})}/>Exibir na página inicial</label>
    <label>Motivo da alteração<textarea value={motivo} required minLength={3} maxLength={500} disabled={bloqueado} onChange={e=>setMotivo(e.target.value)}/></label>
    <div className="administracao-acoes"><button className="button" type="button" disabled={ocupado} onClick={()=>setEdicao(null)}>Cancelar</button><button className="button button-primary" disabled={bloqueado}>{ocupado?'Salvando…':'Salvar banner'}</button></div>
   </form>}
   <div className="banners-lista">{dados.banners.map(b=><article key={b.id}><img src={b.imagem} alt="" loading="lazy"/><div><h3>{dados.catalogo.find(t=>t.id===b.tituloId)?.nome||b.tituloId}</h3><p>{b.ativo?'Ativo':'Pausado'} · {b.intervaloSegundos??padrao}s · ordem {b.ordem}</p></div><button className="button" disabled={bloqueado} onClick={()=>{const {atualizadoEm:_revisao,...campos}=b;void _revisao;setEdicao(campos);setMotivo('');}}>Editar</button></article>)}</div>
  </>}
 </section>;
}
