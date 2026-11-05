'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import AparenciaAdmin from './aparencia-admin';
import './administracao.css';

type Usuario = {id:string;nome:string;papel:string;suspenso:boolean;criadoEm:number};
type Conteudo = {id:string;titulo?:string;corpo:string;tipo?:string;publicacaoId?:string;autorId:string;autorNome:string;oculto:boolean;criadoEm:number};
type Denuncia = {alvoTitulo?:string|null;alvoCorpo?:string|null;alvoOculto?:boolean;id:string;autorId:string;alvoTipo:string;alvoId:string;motivo:string;resolvida:boolean;criadoEm:number};
type Registro = {id:string;autorId:string;acao:string;alvoTipo:string;alvoId:string;motivo:string;criadoEm:number};
type Dados = {usuarios:Usuario[];publicacoes:Conteudo[];respostas:Conteudo[];denuncias:Denuncia[];registros:Registro[];catalogo:{id:string;nome:string;oculto:boolean}[]};
type Props = {usuario:{id?:string;papel?:string;suspenso?:boolean}|null;notificar:(mensagem:string)=>void;recarregar:()=>void|Promise<void>};
type Acao = {rotulo:string;detalhe:string;dados:Record<string,string|boolean>;campos?:('nome'|'titulo'|'corpo')[]};
const rotulos = {nome:'Nome de exibição',titulo:'Título',corpo:'Texto'};
const minimo = (campo:string,acao:Acao)=>campo==='nome'?2:campo==='corpo'&&acao.dados.alvoTipo==='resposta'?1:3;
const maximo = (campo:string,acao:Acao)=>campo==='nome'?60:campo==='titulo'?160:acao.dados.alvoTipo==='resposta'?4000:10000;
const papeis = {membro:'Membro',editor:'Editor',moderador:'Moderador',administrador:'Administrador'};
const acoes:Record<string,string> = {'suspender-usuario':'Situação da conta','alterar-papel':'Papel da conta','moderar-conteudo':'Visibilidade do conteúdo','moderar-catalogo':'Visibilidade no catálogo','editar-usuario':'Nome da conta','editar-conteudo':'Edição de conteúdo','resolver-denuncia':'Situação da denúncia','denunciar':'Denúncia enviada','salvar-aparencia':'Aparência global do site'};
const data = (valor:number)=>new Date(valor).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'});

export default function Administracao({usuario,notificar,recarregar}:Props) {
 const permitido=!!usuario&&!usuario.suspenso&&['moderador','administrador'].includes(usuario.papel||'');
 const administrador=usuario?.papel==='administrador';
 const [dados,setDados]=useState<Dados|null>(null);
 const [aba,setAba]=useState('usuarios');
 const [busca,setBusca]=useState('');const [consulta,setConsulta]=useState('');const [versao,setVersao]=useState(0);
 const [carregando,setCarregando]=useState(false);const [enviando,setEnviando]=useState(false);
 const [erro,setErro]=useState('');const [sucesso,setSucesso]=useState('');
 const [pendente,setPendente]=useState<Acao|null>(null);const [motivo,setMotivo]=useState('');
 const motivoRef=useRef<HTMLTextAreaElement>(null);
 const acaoPendente=pendente?.dados.acao;const alvoPendente=pendente?.dados.alvoId||pendente?.dados.usuarioId||pendente?.dados.denunciaId||pendente?.dados.tituloId;const campoInicial=pendente?.campos?.[0];
 useEffect(()=>{if(acaoPendente){if(campoInicial)document.getElementById('administracao-editar-'+campoInicial)?.focus();else motivoRef.current?.focus();}},[acaoPendente,alvoPendente,campoInicial]);
 useEffect(()=>{
  if(!permitido)return;
  const controle=new AbortController();
  async function carregar(){
   setCarregando(true);setErro('');
   try{
    const resposta=await fetch('/api/yokira?acao=moderacao&busca='+encodeURIComponent(consulta),{signal:controle.signal,cache:'no-store'});
    const resultado=await resposta.json() as Dados&{erro?:string;error?:string};
    if(!resposta.ok)throw new Error(resultado.erro||resultado.error||'Não foi possível carregar o painel.');
    setDados(resultado);
   }catch(falha){if(!controle.signal.aborted)setErro(falha instanceof Error?falha.message:'Não foi possível carregar o painel.');}
   finally{if(!controle.signal.aborted)setCarregando(false);}
  }
  void carregar();return()=>controle.abort();
 },[permitido,usuario?.id,consulta,versao]);
 function preparar(acao:Acao){setPendente(acao);setMotivo('');setErro('');setSucesso('');}
 async function confirmar(){
  if(!pendente||enviando||!edicaoValida||motivo.trim().length<3)return;
  setEnviando(true);setErro('');
  try{
   const resposta=await fetch('/api/yokira',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...pendente.dados,motivo:motivo.trim()})});
   const resultado=await resposta.json() as {erro?:string;error?:string};
   if(!resposta.ok)throw new Error(resultado.erro||resultado.error||'Não foi possível concluir a ação.');
   setPendente(null);setMotivo('');setSucesso('Alteração registrada com sucesso.');setVersao(v=>v+1);notificar('Alteração registrada com sucesso.');
   await recarregar();
  }catch(falha){setErro(falha instanceof Error?falha.message:'Não foi possível concluir a ação.');}
  finally{setEnviando(false);}
 }
 const bloqueado=carregando||enviando;
 const edicaoValida=!pendente||!(pendente.campos||[]).some(campo=>String(pendente.dados[campo]||'').trim().length<minimo(campo,pendente));
 const nome=(id:string)=>dados?.usuarios.find(u=>u.id===id)?.nome||id;
 function moderar(item:Pick<Conteudo,'id'|'titulo'|'corpo'|'oculto'>,alvoTipo:string){preparar({rotulo:item.oculto?'Restaurar conteúdo':'Ocultar conteúdo',detalhe:item.titulo||item.corpo,dados:{acao:'moderar-conteudo',alvoTipo,alvoId:item.id,oculto:!item.oculto}});}
 if(!usuario)return <section className="administracao administracao-vazia"><h1>Entre para acessar o painel</h1><p>Use sua conta para consultar suas permissões de administração.</p><a className="button button-primary" target="_top" href="/signin-with-chatgpt?return_to=%2F%3Fp%3Dadmin">Entrar com ChatGPT</a></section>;
 if(!permitido)return <section className="administracao administracao-vazia"><h1>Acesso restrito</h1><p>{usuario.suspenso?'Sua conta está suspensa.':'Este painel está disponível para moderadores e administradores.'}</p><Link className="button button-subtle" href="/?p=perfil">Voltar ao perfil</Link></section>;
 return <section className="administracao">
  <header className="administracao-cabecalho"><span className="administracao-sobrelinha">YOKIRA / COMUNIDADE</span><h1>Administração</h1><p>Cuide das pessoas e das conversas. Cada alteração fica registrada com seu motivo.</p><span className="administracao-selo">{administrador?'Administrador':'Moderador'}</span>{administrador&&<Link className="administracao-link-editor" href="/?p=acervo-admin">Editar catálogo e editoriais</Link>}</header>
  <nav className="administracao-abas" aria-label="Seções da administração">{[['usuarios','Usuários'],['conteudo','Conteúdo'],['catalogo','Catálogo'],['denuncias','Denúncias'],['registros','Auditoria'],...(administrador?[['aparencia','Aparência']]:[])].map(([id,rotulo])=><button key={id} aria-current={aba===id?'page':undefined} disabled={enviando} onClick={()=>{setAba(id);setPendente(null);}}>{rotulo}{id==='denuncias'&&dados&&<span>{dados.denuncias.filter(d=>!d.resolvida).length}</span>}</button>)}</nav>
  {aba==='aparencia'&&administrador&&<AparenciaAdmin notificar={notificar} recarregar={recarregar}/>}
  {aba!=='aparencia'&&<>
  <form className="administracao-busca" onSubmit={evento=>{evento.preventDefault();setConsulta(busca.trim());setVersao(v=>v+1);}}><label htmlFor="administracao-busca">Buscar no painel<input id="administracao-busca" value={busca} onChange={evento=>setBusca(evento.target.value)} placeholder="Nome, título ou texto" maxLength={100}/></label><button className="button button-subtle" disabled={bloqueado}>Buscar</button><button className="button button-subtle" type="button" disabled={bloqueado} onClick={()=>setVersao(v=>v+1)}>Atualizar</button></form>
  <p className="administracao-ajuda">Até 100 registros recentes por seção. Use a busca para encontrar outros registros.</p>
  {erro&&<div className="administracao-aviso" role="alert"><p>{erro}</p>{!pendente&&<button className="button button-subtle" disabled={bloqueado} onClick={()=>setVersao(v=>v+1)}>Tentar novamente</button>}</div>}
  {sucesso&&<p className="administracao-aviso" role="status">{sucesso}</p>}
  {pendente&&<form className="administracao-confirmacao" aria-labelledby="administracao-acao" onSubmit={evento=>{evento.preventDefault();void confirmar();}}><h2 id="administracao-acao">{pendente.rotulo}</h2><p className="administracao-resumo">{pendente.detalhe}</p>{(pendente.campos||[]).map(campo=><label key={campo} htmlFor={'administracao-editar-'+campo}>{rotulos[campo]}{campo==='corpo'?<textarea id={'administracao-editar-'+campo} value={String(pendente.dados[campo]||'')} onChange={evento=>setPendente({...pendente,dados:{...pendente.dados,[campo]:evento.target.value}})} required minLength={minimo(campo,pendente)} maxLength={maximo(campo,pendente)} disabled={enviando}/>:<input id={'administracao-editar-'+campo} value={String(pendente.dados[campo]||'')} onChange={evento=>setPendente({...pendente,dados:{...pendente.dados,[campo]:evento.target.value}})} required minLength={minimo(campo,pendente)} maxLength={maximo(campo,pendente)} disabled={enviando}/>}</label>)}<label htmlFor="administracao-motivo">Motivo da alteração<textarea ref={motivoRef} id="administracao-motivo" value={motivo} onChange={evento=>setMotivo(evento.target.value)} required minLength={3} maxLength={500} disabled={enviando} aria-describedby="administracao-ajuda-motivo"/></label><p id="administracao-ajuda-motivo" className="administracao-ajuda">De 3 a 500 caracteres. O motivo ficará na auditoria.</p><div className="administracao-acoes"><button className="button button-subtle" type="button" onClick={()=>setPendente(null)} disabled={enviando}>Cancelar</button><button className="button button-primary" disabled={bloqueado||!edicaoValida||motivo.trim().length<3}>{enviando?'Registrando…':'Confirmar alteração'}</button></div></form>}
  <div aria-busy={carregando}>
   {carregando&&<p className="administracao-vazia" role="status">Carregando registros…</p>}
   {!carregando&&dados&&<>
    {aba==='usuarios'&&<div className="administracao-lista"><h2>Usuários <small>({dados.usuarios.length})</small></h2>{!dados.usuarios.length&&<p className="administracao-vazia">Nenhum usuário encontrado.</p>}{dados.usuarios.map(item=>{
     const podeSuspender=item.id!==usuario.id&&(administrador||['membro','editor'].includes(item.papel));
     return <article className="administracao-item" key={item.id}><div className="administracao-item-corpo"><h3>{item.nome}</h3><p>{papeis[item.papel as keyof typeof papeis]||item.papel} · {item.suspenso?'Suspenso':'Ativo'}</p><small>Conta criada em {data(item.criadoEm)}{item.id===usuario.id?' · Sua conta':''}</small></div><div className="administracao-acoes">{administrador&&<button className="button button-subtle" disabled={bloqueado} onClick={()=>preparar({rotulo:'Editar nome de '+item.nome,detalhe:'A alteração será exibida na comunidade.',campos:['nome'],dados:{acao:'editar-usuario',usuarioId:item.id,nome:item.nome}})}>Editar nome</button>}{administrador&&<label className="administracao-papel">Papel de {item.nome}<select value={item.papel} disabled={bloqueado} onChange={evento=>preparar({rotulo:'Alterar papel de '+item.nome,detalhe:'Novo papel: '+papeis[evento.target.value as keyof typeof papeis],dados:{acao:'alterar-papel',usuarioId:item.id,papel:evento.target.value}})}>{Object.entries(papeis).map(([id,rotulo])=><option key={id} value={id}>{rotulo}</option>)}</select></label>}<button className="button button-subtle" disabled={bloqueado||!podeSuspender} title={!podeSuspender?'Esta conta não pode ser alterada por você.':undefined} onClick={()=>preparar({rotulo:(item.suspenso?'Reativar ':'Suspender ')+item.nome,detalhe:item.suspenso?'A conta poderá voltar a participar.':'A conta ficará impedida de publicar e interagir.',dados:{acao:'suspender-usuario',usuarioId:item.id,suspenso:!item.suspenso}})}>{item.suspenso?'Reativar':'Suspender'}</button></div></article>;
    })}</div>}
    {aba==='conteudo'&&<div className="administracao-lista"><h2>Publicações e respostas</h2>{!dados.publicacoes.length&&!dados.respostas.length&&<p className="administracao-vazia">Nenhum conteúdo encontrado.</p>}{[...dados.publicacoes.map(item=>({...item,alvoTipo:'publicacao'})),...dados.respostas.map(item=>({...item,alvoTipo:'resposta'}))].map(item=><article className="administracao-item" key={item.alvoTipo+item.id}><div className="administracao-item-corpo"><span className="administracao-selo">{item.alvoTipo==='resposta'?'Resposta':'Publicação'} · {item.oculto?'Oculto':'Visível'}</span><h3>{item.titulo||'Resposta de '+item.autorNome}</h3><p className="administracao-resumo">{item.corpo}</p><small>{item.autorNome} · {data(item.criadoEm)}</small></div><div className="administracao-acoes">{administrador&&<button className="button button-subtle" disabled={bloqueado} onClick={()=>preparar({rotulo:'Editar conteúdo',detalhe:item.titulo||'Resposta de '+item.autorNome,campos:item.alvoTipo==='publicacao'?['titulo','corpo']:['corpo'],dados:{acao:'editar-conteudo',alvoTipo:item.alvoTipo,alvoId:item.id,titulo:item.titulo||'',corpo:item.corpo}})}>Editar</button>}<button className="button button-subtle" disabled={bloqueado} onClick={()=>moderar(item,item.alvoTipo)}>{item.oculto?'Restaurar':'Ocultar'}</button></div></article>)}</div>}
    {aba==='catalogo'&&<div className="administracao-lista"><h2>Visibilidade do catálogo</h2><p className="administracao-ajuda">Títulos ocultos deixam de aparecer no catálogo público.</p>{!dados.catalogo.length&&<p className="administracao-vazia">Nenhum título encontrado.</p>}{dados.catalogo.map(item=><article className="administracao-item" key={item.id}><div className="administracao-item-corpo"><h3>{item.nome}</h3><span className="administracao-selo">{item.oculto?'Oculto':'Visível'}</span></div><button className="button button-subtle" disabled={bloqueado} onClick={()=>preparar({rotulo:item.oculto?'Restaurar título no catálogo':'Ocultar título do catálogo',detalhe:item.nome,dados:{acao:'moderar-catalogo',tituloId:item.id,oculto:!item.oculto}})}>{item.oculto?'Restaurar':'Ocultar'}</button></article>)}</div>}
    {aba==='denuncias'&&<div className="administracao-lista"><h2>Denúncias</h2>{!dados.denuncias.length&&<p className="administracao-vazia">Nenhuma denúncia encontrada.</p>}{dados.denuncias.map(item=>{
     const alvo=(item.alvoTipo==='resposta'?dados.respostas:dados.publicacoes).find(conteudo=>conteudo.id===item.alvoId)||(item.alvoCorpo!=null?{id:item.alvoId,titulo:item.alvoTitulo||undefined,corpo:item.alvoCorpo,oculto:item.alvoOculto===true}:null);
     return <article className="administracao-item" key={item.id}><div className="administracao-item-corpo"><span className="administracao-selo">{item.resolvida?'Resolvida':'Pendente'}</span><h3>{alvo?.titulo||(item.alvoTipo==='resposta'?'Resposta denunciada':'Publicação denunciada')}</h3>{alvo&&<p className="administracao-resumo">{alvo.corpo}</p>}<p><strong>Motivo:</strong> {item.motivo}</p><small>Enviada por {nome(item.autorId)} · {data(item.criadoEm)}</small></div><div className="administracao-acoes">{alvo&&<button className="button button-subtle" disabled={bloqueado} onClick={()=>moderar(alvo,item.alvoTipo)}>{alvo.oculto?'Restaurar conteúdo':'Ocultar conteúdo'}</button>}<button className="button button-subtle" disabled={bloqueado} onClick={()=>preparar({rotulo:item.resolvida?'Reabrir denúncia':'Resolver denúncia',detalhe:item.motivo,dados:{acao:'resolver-denuncia',denunciaId:item.id,resolvida:!item.resolvida}})}>{item.resolvida?'Reabrir':'Resolver'}</button></div></article>;
    })}</div>}
    {aba==='registros'&&<div className="administracao-lista"><h2>Histórico de alterações</h2>{!dados.registros.length&&<p className="administracao-vazia">Ainda não há alterações registradas.</p>}{dados.registros.map(item=><article className="administracao-item" key={item.id}><div className="administracao-item-corpo"><h3>{acoes[item.acao]||item.acao}</h3><p>{item.motivo}</p><small>{nome(item.autorId)} · {data(item.criadoEm)}</small><p className="administracao-identificador">{item.alvoTipo}: {item.alvoId}</p></div></article>)}</div>}
   </>}
  </div>
  </>}
 </section>;
}
