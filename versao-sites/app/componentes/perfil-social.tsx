'use client';
import { useEffect, useRef, useState } from 'react';
import type { EdicaoPerfil, PerfilSocial as Perfil } from '@/lib/social';
import { requisicaoSocial } from '@/lib/social-cliente';
import ImagemComunidade from './imagem-comunidade';
import { AvatarComunidade } from './cartao-perfil';
import './social.css';
type Props = { usuarioId: string; aoSalvar?: () => void | Promise<void>; navegar?: (pagina: string, params?: Record<string,string>) => void };
export default function PerfilSocial(props: Props) { return <EditorPerfil key={props.usuarioId} {...props}/>; }
function EditorPerfil({ aoSalvar, navegar }: Props) {
 const [perfil, setPerfil] = useState<Perfil | null>(null), [edicao, setEdicao] = useState<EdicaoPerfil | null>(null);
 const [erro, setErro] = useState(''), [sucesso, setSucesso] = useState(''), [ocupado, setOcupado] = useState(false), [consulta, setConsulta] = useState('');
 const trava = useRef(false), vivo = useRef(true), versaoConsulta = useRef(0);
 const [tentativa, setTentativa] = useState(0);
 const [envios,setEnvios]=useState({avatar:false,banner:false});
 const imagemPendente=envios.avatar||envios.banner;
 useEffect(() => {
  vivo.current = true; const controle = new AbortController();
  void requisicaoSocial<{perfil:Perfil}>({acao:'perfil-social'}, undefined, controle.signal).then(({perfil:p}) => { setPerfil(p); setEdicao({nome:p.nome,handle:p.handle,bio:p.bio,publico:p.publico,mostrarConquistas:p.mostrarConquistas,avatar:p.avatar,banner:p.banner,compartilharAtividade:p.compartilharAtividade}); }).catch(e => { if (!controle.signal.aborted) setErro(e.message); });
  return () => { vivo.current = false; controle.abort(); };
 }, [tentativa]);
 async function salvar(e: React.FormEvent) {
  e.preventDefault(); if (!edicao || trava.current || imagemPendente) return;
  trava.current = true; setOcupado(true); setErro(''); setSucesso('');
  try {
   const {perfil:p} = await requisicaoSocial<{perfil:Perfil}>(null,{acao:'salvar-perfil-social',nome:edicao.nome,handle:edicao.handle,bio:edicao.bio,publico:edicao.publico,mostrarConquistas:edicao.mostrarConquistas,avatar:edicao.avatar,banner:edicao.banner,compartilharAtividade:edicao.compartilharAtividade});
   if (!vivo.current) return;
   setPerfil(p); setEdicao({nome:p.nome,handle:p.handle,bio:p.bio,publico:p.publico,mostrarConquistas:p.mostrarConquistas,avatar:p.avatar,banner:p.banner,compartilharAtividade:p.compartilharAtividade}); setSucesso('Perfil salvo.'); await aoSalvar?.();
  } catch (e) { if(vivo.current)setErro(e instanceof Error ? e.message : 'Tente novamente.'); }
  finally { trava.current = false; if(vivo.current)setOcupado(false); }
 }
 async function verificar() {
  if (!edicao || trava.current || imagemPendente) return;
  const versao = ++versaoConsulta.current;
  setConsulta('Consultando disponibilidade…');
  try { const r = await requisicaoSocial<{disponivel:boolean;sugestao:string}>({acao:'handle-disponivel',handle:edicao.handle}); if(vivo.current && versao === versaoConsulta.current)setConsulta(r.disponivel ? 'Este @ está disponível.' : `Já está em uso. Sugestão disponível: @${r.sugestao}`); }
  catch(e) { if(vivo.current && versao === versaoConsulta.current)setConsulta(e instanceof Error ? e.message : 'Tente novamente.'); }
 }
 return <section className="social-painel" aria-labelledby="social-editor-titulo">
  <header><div><span className="social-legenda">SUA IDENTIDADE</span><h2 id="social-editor-titulo">Perfil na comunidade</h2><p>Escolha como as pessoas encontram você. Seu email não aparece no perfil.</p></div>{perfil && navegar && <button type="button" onClick={() => navegar('perfil-publico',{handle:perfil.handle})}>Ver meu perfil</button>}</header>
  {erro && <p role="alert" className="social-erro">{erro}</p>}{sucesso && <p role="status">{sucesso}</p>}
  {!edicao ? <p role="status">{erro ? <button type="button" onClick={() => setTentativa(t => t + 1)}>Tentar novamente</button> : 'Carregando seu perfil…'}</p> : <form onSubmit={salvar}>
   <div className="perfil-imagens-editor"><div><h3>Foto de perfil</h3><AvatarComunidade nome={edicao.nome} avatar={edicao.avatar}/><ImagemComunidade finalidade="avatar" onOcupado={ativo=>setEnvios(v=>({...v,avatar:ativo}))} disabled={ocupado} onEnviada={avatar => setEdicao(atual => atual ? {...atual,avatar} : atual)}/>{edicao.avatar && <button type="button" disabled={ocupado} onClick={() => setEdicao({...edicao,avatar:''})}>Remover foto</button>}<p className="social-ajuda">Sua foto e seu nome ficam visíveis na comunidade.</p></div>
   <div><h3>Banner do perfil</h3>{edicao.banner && <img className="perfil-banner" src={edicao.banner} alt="Prévia do banner"/>}<ImagemComunidade finalidade="banner" onOcupado={ativo=>setEnvios(v=>({...v,banner:ativo}))} disabled={ocupado} onEnviada={banner => setEdicao(atual => atual ? {...atual,banner} : atual)}/>{edicao.banner && <button type="button" disabled={ocupado} onClick={() => setEdicao({...edicao,banner:''})}>Remover banner</button>}</div></div>
   <div className="social-campos"><label>Nome público<input required minLength={2} maxLength={60} value={edicao.nome} disabled={ocupado} onChange={e => setEdicao({...edicao,nome:e.target.value})}/></label>
   <label>Identificador @<input required minLength={3} maxLength={24} pattern="[a-zA-Z0-9][a-zA-Z0-9_]{2,23}" autoCapitalize="none" spellCheck={false} aria-describedby="social-handle-ajuda" value={edicao.handle} disabled={ocupado} onChange={e => {setEdicao({...edicao,handle:e.target.value});versaoConsulta.current++;setConsulta('');}}/></label></div>
   <p id="social-handle-ajuda" className="social-ajuda">De 3 a 24 letras, números ou sublinhado. Letras maiúsculas são convertidas para minúsculas.</p>
   <div className="social-consulta"><button type="button" disabled={ocupado} onClick={() => void verificar()}>Verificar @</button><span role="status">{consulta}</span></div>
   <label>Biografia<textarea maxLength={280} rows={3} value={edicao.bio} disabled={ocupado} onChange={e => setEdicao({...edicao,bio:e.target.value})}/><small>{edicao.bio.length}/280</small></label>
   <label className="social-checkbox"><input type="checkbox" checked={edicao.publico} disabled={ocupado} onChange={e => setEdicao({...edicao,publico:e.target.checked})}/><span>Permitir encontrar meu perfil na busca e abrir pelo @</span></label>
   <p className="social-ajuda">Com o perfil privado, apenas você e suas amizades atuais podem abri-lo. Sua coleção e seu histórico permanecem pessoais.</p>
   <label className="social-checkbox"><input type="checkbox" checked={edicao.mostrarConquistas} disabled={ocupado} onChange={e => setEdicao({...edicao,mostrarConquistas:e.target.checked})}/><span>Mostrar minhas conquistas em destaque no perfil</span></label>
   <label className="social-checkbox"><input type="checkbox" checked={!!edicao.compartilharAtividade} disabled={ocupado} onChange={e => setEdicao({...edicao,compartilharAtividade:e.target.checked})}/><span>Compartilhar o anime e o episódio que estou assistindo</span></label>
   <p className="social-ajuda">Desativado por padrão. Quando ativado, apenas quem pode abrir seu perfil vê sua atividade mais recente. Sua coleção e seu histórico completo continuam pessoais.</p>
   <div className="social-final"><button type="submit" disabled={ocupado||imagemPendente}>{ocupado ? 'Salvando…' : 'Salvar perfil'}</button>{perfil && <span>Seu @ atual: @{perfil.handle}</span>}</div>
  </form>}
 </section>;
}
