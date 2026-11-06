'use client';
import { useEffect, useId, useRef, useState } from 'react';
import type { MensagemChat } from '../../lib/chat';
import { Icone } from './icones';
import { useChatGlobal } from './chat-global-dados';
import ChatGlobalEditor from './chat-global-editor';
import ChatGlobalMensagem from './chat-global-mensagem';
import './chat-global.css';

type Navegar = (pagina: string, params?: Record<string, string>) => void;
type Props = { usuario: Record<string, unknown> | null; navegar: Navegar; notificar?: (mensagem: string) => void };
export default function ChatGlobal({ usuario, navegar }: Props) {
 const [aberto, setAberto] = useState(false), id = useId(), controle = useRef<HTMLButtonElement>(null);
 const usuarioId = usuario?.id ? String(usuario.id) : undefined, ativo = !!usuarioId && !usuario?.suspenso;
 const identidade = `${usuarioId || 'anonimo'}:${ativo ? 'ativo' : 'leitura'}`;
 const chat = useChatGlobal(aberto, identidade);
 const fechar = () => { setAberto(false); controle.current?.focus(); };
 const navegarDoChat:Navegar=(pagina,params)=>{setAberto(false);navegar(pagina,params);};
 return <aside className={'chat-global' + (aberto ? ' chat-global-aberto' : '')} aria-label="Chat global" onKeyDown={e => { if (aberto && e.key === 'Escape' && !e.defaultPrevented) { e.stopPropagation(); fechar(); } }}>
  <button type="button" className="chat-global-controle" ref={controle} aria-expanded={aberto} aria-controls={id} aria-label={aberto ? 'Recolher chat global' : 'Abrir chat global'} onClick={() => aberto ? fechar() : setAberto(true)}>
   <span className="chat-global-simbolo"><Icone nome="forum" tamanho={20}/></span><span><strong>Chat global</strong>{aberto && <small>Conversa da comunidade</small>}</span><Icone nome={aberto ? 'fechar' : 'mais'} tamanho={16}/>
  </button>
  <div id={id} hidden={!aberto} className="chat-global-painel">
   <ChatGlobalConteudo key={identidade} aberto={aberto} mensagens={chat.mensagens} carregando={chat.carregando} erro={chat.erro} atualizar={chat.atualizar} executar={chat.executar} usuarioId={usuarioId} ativo={ativo} navegar={navegarDoChat}/>
  </div>
 </aside>;
}
type ConteudoProps = { aberto: boolean; mensagens: MensagemChat[]; carregando: boolean; erro: string; atualizar: () => void; executar: <T>(acao: string, dados: Record<string, unknown>) => Promise<T>; usuarioId?: string; ativo: boolean; navegar: Navegar };
function ChatGlobalConteudo({ aberto, mensagens, carregando, erro, atualizar, executar, usuarioId, ativo, navegar }: ConteudoProps) {
 const lista = useRef<HTMLDivElement>(null), noFim = useRef(true), anteriores = useRef<Set<string> | null>(null);
 const [naoLidas, setNaoLidas] = useState<string[]>([]), [entrando, setEntrando] = useState(''), [erroSala, setErroSala] = useState('');
 const travaSala = useRef(false);
 const irAoFim = () => { noFim.current = true; if (lista.current) lista.current.scrollTop = lista.current.scrollHeight; setNaoLidas([]); };
 const ajustarFoto = () => { if (noFim.current && lista.current) lista.current.scrollTop = lista.current.scrollHeight; };
 useEffect(() => {
  if (!aberto) return;
  const ids = new Set(mensagens.map(m => m.id)), novas = anteriores.current ? mensagens.filter(m => !anteriores.current?.has(m.id)).map(m => m.id) : [];
  anteriores.current = ids;
  if (noFim.current) { if (lista.current) lista.current.scrollTop = lista.current.scrollHeight; }
  else setNaoLidas(v => [...new Set([...v.filter(id => ids.has(id)), ...novas])]);
 }, [mensagens, aberto]);
 const entrarSala = async (mensagemId: string) => {
  if (!ativo || travaSala.current) return;
  travaSala.current = true; setEntrando(mensagemId); setErroSala('');
  try { const r = await executar<{ salaId: string }>('sala-entrar-chat', { mensagemId }); navegar('sala', { salaId: r.salaId }); }
  catch (e) { setErroSala(e instanceof Error ? e.message : 'Não foi possível entrar na sala.'); }
  finally { travaSala.current = false; setEntrando(''); }
 };
 return <>
  <div className="chat-global-leitura" ref={lista} role="log" aria-label="Mensagens do chat global" aria-live="polite" aria-relevant="additions" onScroll={() => { const el = lista.current; if (el) { noFim.current = el.scrollHeight - el.scrollTop - el.clientHeight < 56; if (noFim.current) setNaoLidas([]); } }}>
   {carregando && !mensagens.length && <p className="chat-global-vazio" role="status">Carregando conversa…</p>}
   {!carregando && !erro && !mensagens.length && <div className="chat-global-vazio"><Icone nome="forum" tamanho={28}/><p>Nenhuma mensagem ainda.</p><small>Envie textos ou fotos para a comunidade.</small></div>}
   {mensagens.map(m => <ChatGlobalMensagem key={m.id} mensagem={m} usuarioId={usuarioId} ativo={ativo} entrando={entrando === m.id} bloqueado={!!entrando} navegar={navegar} entrarSala={() => void entrarSala(m.id)} imagemCarregada={ajustarFoto}/>)}
  </div>
  {!!naoLidas.length && <button type="button" className="chat-global-novas" onClick={irAoFim}>{naoLidas.length === 1 ? '1 nova mensagem' : `${naoLidas.length} novas mensagens`}<Icone nome="seta" tamanho={14}/></button>}
  {erro && <div className="chat-global-falha" role="status"><span>{erro}</span><button type="button" onClick={atualizar}>Tentar novamente</button></div>}
  {erroSala && <p className="chat-global-erro chat-global-erro-sala" role="alert">{erroSala}</p>}
  <ChatGlobalEditor ativo={ativo} autenticado={!!usuarioId} entrar={() => navegar('perfil')} enviar={dados => executar('chat-global-enviar', dados)} aoEnviar={irAoFim}/>
 </>;
}
