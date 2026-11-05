'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, Sparkles, Trophy, X, ArrowUpRight } from 'lucide-react';
import { origemNotificacao, type Notificacao } from '@/lib/notificacoes';
import Celebracao from './celebracao';
import './notificacoes.css';

type Props = {
 usuario: { id?: string; xp?: number; nivel?: number; suspenso?: boolean } | null;
 navegar: (pagina: string, params?: Record<string, string>) => void;
 notificar?: (mensagem: string) => void;
};
async function registrar(ids: string[], ler: boolean, celebrar = false) {
 const resposta = await fetch('/api/yokira', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ acao: 'notificacoes-ver', ids, ler, celebrar }) });
 const dados = await resposta.json() as { eventos?: Notificacao[]; erro?: string };
 if (!resposta.ok) throw new Error(dados.erro || 'Não foi possível atualizar as notificações.');
 return dados.eventos || [];
}

export default function Notificacoes(props: Props) {
 return props.usuario ? <NotificacoesPrivadas key={props.usuario.id || 'sessao'} {...props}/> : null;
}
function NotificacoesPrivadas({ usuario, navegar }: Props) {
 const [lista, setLista] = useState<Notificacao[]>([]);
 const [aberto, setAberto] = useState(false);
 const [erro, setErro] = useState('');
 const [evento, setEvento] = useState<Notificacao | null>(null);
 const [pausado, setPausado] = useState(false);
 const [pronto, setPronto] = useState('');
 const raiz = useRef<HTMLDivElement>(null), sino = useRef<HTMLButtonElement>(null), painel = useRef<HTMLElement>(null);
 const dialogo = useRef<HTMLDialogElement>(null), reivindicando = useRef(''), versao = useRef(0);
 const chave = usuario ? usuario.id || 'sessao' : '';
 const identidade = useRef(chave);
 useEffect(() => { identidade.current = chave; return () => { identidade.current = ''; }; }, [chave]);
 const recarregar = useCallback(async () => {
  if (!chave) return;
  const requisicao = ++versao.current;
  try {
   const resposta = await fetch('/api/yokira?acao=notificacoes', { cache: 'no-store' });
   const dados = await resposta.json() as { notificacoes?: Notificacao[]; erro?: string };
   if (!resposta.ok) throw new Error(dados.erro || 'Não foi possível carregar as notificações.');
   if (identidade.current !== chave || requisicao !== versao.current) return;
   setLista(dados.notificacoes || []); setErro(''); setPronto(chave);
  } catch (e) { if (identidade.current === chave) setErro(e instanceof Error ? e.message : 'Sem conexão. Tente novamente.'); }
 }, [chave]);
 useEffect(() => {
  queueMicrotask(() => { setLista([]); setEvento(null); setAberto(false); setPausado(false); setPronto(''); });
 }, [chave]);
 useEffect(() => {
  queueMicrotask(() => { void recarregar(); });
  const atualizar = () => { if (document.visibilityState === 'visible') void recarregar(); };
  window.addEventListener('focus', atualizar); document.addEventListener('visibilitychange', atualizar);
  return () => { window.removeEventListener('focus', atualizar); document.removeEventListener('visibilitychange', atualizar); };
 }, [recarregar, usuario?.xp, usuario?.nivel]);
 useEffect(() => {
  if (!chave || pronto !== chave || evento || pausado || reivindicando.current === chave || document.visibilityState !== 'visible') return;
  const proximo = lista.find(item => item.celebradaEm === null);
  if (!proximo) return;
  reivindicando.current = chave;
  void registrar([proximo.id], false, true).then(eventos => {
   if (reivindicando.current === chave) reivindicando.current = '';
   if (identidade.current !== chave) return;
   setLista(anteriores => anteriores.map(item => item.id === proximo.id ? { ...item, celebradaEm: Date.now() } : item));
   if (eventos[0]) setEvento(eventos[0]);
  }).catch(() => { if (reivindicando.current === chave) reivindicando.current = ''; if (identidade.current === chave) setPausado(true); });
 }, [lista, evento, pausado, pronto, chave]);
 useEffect(() => {
  if (!evento) { dialogo.current?.close(); return; }
  if (!dialogo.current?.open) dialogo.current?.showModal();
 }, [evento]);
 useEffect(() => {
  if (!aberto) return;
  painel.current?.focus();
  const fora = (e: PointerEvent) => { if (!raiz.current?.contains(e.target as Node)) setAberto(false); };
  const escape = (e: KeyboardEvent) => { if (e.key === 'Escape') { setAberto(false); sino.current?.focus(); } };
  document.addEventListener('pointerdown', fora); document.addEventListener('keydown', escape);
  return () => { document.removeEventListener('pointerdown', fora); document.removeEventListener('keydown', escape); };
 }, [aberto]);
 async function ler(itens: Notificacao[]) {
  if (!itens.length) return;
  try {
   await registrar(itens.map(item => item.id), true);
   setLista(anteriores => anteriores.map(item => itens.some(alvo => alvo.id === item.id) ? { ...item, lidaEm: item.lidaEm || Date.now() } : item));
  } catch (e) { setErro(e instanceof Error ? e.message : 'Tente novamente.'); }
 }
 function origem(item: Notificacao) {
  const destino = origemNotificacao(item.destino);
  void ler([item]); setAberto(false); setEvento(null); setPausado(true);
  navegar(destino.pagina, destino.params);
 }
 function fecharFesta() { setPausado(true); setEvento(null); }
 const naoLidas = lista.filter(item => item.lidaEm === null).length;
 if (!usuario) return null;
 return <div className="notificacoes" ref={raiz}>
  <button ref={sino} className="notificacoes-sino" aria-label={`Notificações${naoLidas ? `: ${naoLidas} não lidas` : ''}`} title="Notificações" aria-expanded={aberto} aria-controls="notificacoes-historico" onClick={() => { setAberto(!aberto); if (!aberto) void recarregar(); }}><Bell size={19}/>{naoLidas > 0 && <span>{naoLidas > 99 ? '99+' : naoLidas}</span>}</button>
  {aberto && <section id="notificacoes-historico" className="notificacoes-painel" ref={painel} tabIndex={-1} aria-label="Histórico de notificações">
   <header><div><span className="notificacoes-legenda">SUA JORNADA</span><h2>Notificações</h2></div><button aria-label="Fechar notificações" onClick={() => { setAberto(false); sino.current?.focus(); }}><X size={18}/></button></header>
   <p className="notificacoes-intro">Cada passo fica guardado aqui. Abra uma novidade para voltar à sua origem.</p>
   {naoLidas > 0 && <button className="notificacoes-marcar" onClick={() => void ler(lista.filter(item => item.lidaEm === null).slice(0, 200))}><CheckCheck size={15}/> Marcar como lidas</button>}
   {erro && <p className="notificacoes-erro" role="alert">{erro} <button onClick={() => void recarregar()}>Tentar novamente</button></p>}
   {!lista.length && !erro && <div className="notificacoes-vazio"><Sparkles size={25}/><p>Os próximos capítulos da sua jornada aparecerão aqui.</p></div>}
   <ol>{lista.map(item => <li key={item.id}><button className={item.lidaEm === null ? 'nao-lida' : ''} onClick={() => origem(item)}><span className={`notificacoes-insignia ${item.tipo}`}><Trophy size={18}/></span><span className="notificacoes-conteudo"><strong>{item.titulo}</strong><span>{item.descricao}</span><small>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(item.criadoEm)}</small><code>{origemNotificacao(item.destino).caminho}</code></span><ArrowUpRight size={14}/></button></li>)}</ol>
   <footer>Seu histórico é privado e acompanha sua conta.</footer>
  </section>}
  <dialog ref={dialogo} className={`notificacoes-celebracao ${evento?.tipo || ''}`} aria-labelledby="notificacoes-celebracao-titulo" onCancel={e => { e.preventDefault(); fecharFesta(); }} onClick={e => { if (e.target === e.currentTarget) fecharFesta(); }}>
   {evento && <Celebracao key={evento.id} evento={evento} fechar={fecharFesta} continuar={() => { void ler([evento]); setEvento(null); }} origem={() => origem(evento)}/>}
  </dialog>
 </div>;
}
