'use client';
import { useRef, useState } from 'react';
import type { OperacaoAmizade, PessoaSocial } from '@/lib/social';
import { enviarAmizade } from '@/lib/social-cliente';
const rotulos: Record<OperacaoAmizade, string> = { solicitar: 'Adicionar amizade', aceitar: 'Aceitar', recusar: 'Recusar', cancelar: 'Cancelar solicitação', remover: 'Remover amizade', bloquear: 'Bloquear', desbloquear: 'Desbloquear' };
export default function AcoesAmizade({ pessoa, atualizar }: { pessoa: PessoaSocial; atualizar: () => void | Promise<void> }) {
 const [ocupado, setOcupado] = useState(false), [erro, setErro] = useState(''), trava = useRef(false);
 const operacoes: OperacaoAmizade[] = pessoa.relacao === 'amigo' ? ['remover','bloquear'] : pessoa.relacao === 'recebida' ? ['aceitar','recusar','bloquear'] : pessoa.relacao === 'enviada' ? ['cancelar','bloquear'] : pessoa.relacao === 'bloqueado' ? ['desbloquear'] : pessoa.relacao === 'proprio' ? [] : ['solicitar','bloquear'];
 async function executar(op: OperacaoAmizade) {
  if (trava.current) return;
  trava.current = true; setOcupado(true); setErro('');
  try { await enviarAmizade(op, pessoa.id); await atualizar(); }
  catch (e) { setErro(e instanceof Error ? e.message : 'Tente novamente.'); }
  finally { trava.current = false; setOcupado(false); }
 }
 return <div className="social-acoes">{operacoes.map(op => <button type="button" key={op} disabled={ocupado} className={op === 'bloquear' || op === 'remover' ? 'social-discreto' : ''} onClick={() => void executar(op)}>{rotulos[op]}</button>)}{erro && <p role="alert" className="social-erro">{erro}</p>}</div>;
}
