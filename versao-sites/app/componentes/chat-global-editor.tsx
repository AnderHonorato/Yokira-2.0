'use client';
import { useRef, useState, type FormEvent } from 'react';
import ImagemComunidade from './imagem-comunidade';
import { Icone } from './icones';

type Props = { ativo: boolean; autenticado: boolean; entrar: () => void; enviar: (dados: Record<string, unknown>) => Promise<unknown>; aoEnviar: () => void };
export default function ChatGlobalEditor({ ativo, autenticado, entrar, enviar, aoEnviar }: Props) {
 const [corpo, setCorpo] = useState(''), [imagem, setImagem] = useState(''), [erro, setErro] = useState('');
 const [enviando, setEnviando] = useState(false), [upload, setUpload] = useState(false), [revisao, setRevisao] = useState(0);
 const tentativa = useRef<{ assinatura: string; id: string } | null>(null);
 const trava = useRef(false), formulario = useRef<HTMLFormElement>(null);
 const publicar = async (e: FormEvent) => {
  e.preventDefault();
  if (trava.current || upload || !ativo || (!corpo.trim() && !imagem)) return;
  trava.current = true; setEnviando(true); setErro('');
  try {
   const assinatura = JSON.stringify([corpo.trim(), imagem]);
   if (tentativa.current?.assinatura !== assinatura) tentativa.current = { assinatura, id: crypto.randomUUID() };
   await enviar({ requisicaoId: tentativa.current.id, ...(corpo.trim() ? { corpo: corpo.trim() } : {}), ...(imagem ? { imagem } : {}) });
   tentativa.current = null; setCorpo(''); setImagem(''); setRevisao(v => v + 1); aoEnviar();
  } catch (e) { setErro(e instanceof Error ? e.message : 'Mensagem não enviada. Tente novamente.'); }
  finally { trava.current = false; setEnviando(false); }
 };
 if (!ativo) return <div className="chat-global-acesso">{autenticado ? <p>Sua conta precisa estar ativa para participar.</p> : <><p>Entre na sua conta para conversar e compartilhar fotos.</p><button type="button" className="button button-primary" onClick={entrar}>Entrar ou criar conta</button></>}</div>;
 return <form className="chat-global-editor" ref={formulario} onSubmit={e => void publicar(e)}>
  <label htmlFor="chat-global-texto">Sua mensagem</label>
  <textarea id="chat-global-texto" rows={2} maxLength={1000} value={corpo} disabled={enviando} placeholder="Converse com a comunidade…"
   onChange={e => setCorpo(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); formulario.current?.requestSubmit(); } }}/>
  {imagem && <div className="chat-global-anexo"><img src={imagem} alt="Foto anexada à sua mensagem"/><button type="button" onClick={() => { setImagem(''); setRevisao(v => v + 1); }} disabled={enviando} aria-label="Remover foto"><Icone nome="fechar" tamanho={14}/></button><span>Foto pronta para enviar</span></div>}
  <div className="chat-global-editor-acoes"><ImagemComunidade key={revisao} compacto finalidade="chat" onEnviada={setImagem} onOcupado={setUpload} disabled={enviando || upload}/><small>{corpo.length}/1000</small><button type="submit" className="chat-global-enviar" disabled={enviando || upload || (!corpo.trim() && !imagem)}>{enviando ? 'Enviando…' : 'Enviar'}<Icone nome="seta" tamanho={15}/></button></div>
  {erro && <p className="chat-global-erro" role="alert">{erro}</p>}
 </form>;
}
