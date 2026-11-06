'use client';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { MensagemChat } from '../../lib/chat';
import { requisicaoSocial } from '../../lib/social-cliente';

type Leitura = { mensagens: MensagemChat[]; servidorEm: number };
export function useChatGlobal(aberto: boolean, identidade: string) {
 const [dados, setDados] = useState<{ identidade: string; mensagens: MensagemChat[] }>({ identidade, mensagens: [] });
 const [estado, setEstado] = useState({ identidade, erro: '', carregando: true });
 const [revisao, setRevisao] = useState(0);
 const identidadeAtual = useRef(identidade), pedidos = useRef(0), ultimoServidor = useRef(0);
 const mutacoes = useRef(new Set<AbortController>());
 useLayoutEffect(() => { identidadeAtual.current = identidade; }, [identidade]);
 const atualizar = useCallback(() => setRevisao(v => v + 1), []);
 useEffect(() => {
  ultimoServidor.current = 0;
  const pendentes = mutacoes.current;
  return () => { for (const abort of pendentes) abort.abort(); pendentes.clear(); };
 }, [identidade]);
 useEffect(() => {
  if (!aberto) return;
  let encerrado = false, falhas = 0, timer: ReturnType<typeof setTimeout> | undefined;
  let abort: AbortController | undefined;
  const carregar = async () => {
   if (encerrado || document.hidden) return;
   abort?.abort(); abort = new AbortController();
   const controle = abort, numero = ++pedidos.current;
   setEstado(v => ({ identidade, carregando: v.identidade !== identidade || v.carregando, erro: v.identidade === identidade ? v.erro : '' }));
   try {
    const r = await requisicaoSocial<Leitura>({ acao: 'chat-global' }, undefined, controle.signal);
    if (encerrado || controle.signal.aborted || identidadeAtual.current !== identidade || numero !== pedidos.current) return;
    if (r.servidorEm >= ultimoServidor.current) {
     ultimoServidor.current = r.servidorEm;
     setDados({ identidade, mensagens: r.mensagens });
    }
    falhas = 0; setEstado({ identidade, erro: '', carregando: false });
   } catch (e) {
    if (encerrado || controle.signal.aborted || identidadeAtual.current !== identidade) return;
    falhas++;
    setEstado({ identidade, erro: e instanceof Error ? e.message : 'Não foi possível carregar a conversa.', carregando: false });
   } finally {
    if (!encerrado && !controle.signal.aborted && !document.hidden) timer = setTimeout(() => void carregar(), Math.min(30000, 4000 * 2 ** falhas));
   }
  };
  const visibilidade = () => {
   clearTimeout(timer);
   if (document.hidden) abort?.abort(); else void carregar();
  };
  document.addEventListener('visibilitychange', visibilidade);
  void carregar();
  return () => { encerrado = true; clearTimeout(timer); abort?.abort(); document.removeEventListener('visibilitychange', visibilidade); };
 }, [aberto, identidade, revisao]);
 const executar = useCallback(async <T,>(acao: string, valores: Record<string, unknown>): Promise<T> => {
  const abort = new AbortController(); mutacoes.current.add(abort);
  try {
   const r = await requisicaoSocial<T>(null, { acao, ...valores }, abort.signal);
   if (abort.signal.aborted || identidadeAtual.current !== identidade) throw new Error('Sua sessão mudou. Tente novamente.');
   atualizar(); return r;
  } finally { mutacoes.current.delete(abort); }
 }, [identidade, atualizar]);
 return { mensagens: dados.identidade === identidade ? dados.mensagens : [], erro: estado.identidade === identidade ? estado.erro : '', carregando: estado.identidade !== identidade || estado.carregando, atualizar, executar };
}
