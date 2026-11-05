'use client';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, LockKeyhole, Pencil, X } from 'lucide-react';
import { nomesRaridades, type HallConquistas as PainelConquistas } from '@/lib/conquistas';
import EmblemaConquista from './emblema-conquista';
import './hall-conquistas.css';
export default function HallConquistas({ painel, onSalvar }: {
 painel: PainelConquistas; onSalvar: (destaques: string[]) => Promise<void>;
}) {
 const [editando, setEditando] = useState(false), [selecao, setSelecao] = useState<string[]>([]);
 const [salvando, setSalvando] = useState(false), [erro, setErro] = useState('');
 const destaques = editando ? selecao : painel.destaques;
 const obtidas = painel.conquistas.filter(item => item.obtidaEm !== null).length;
 function selecionar(id: string) {
  setErro('');
  if (selecao.includes(id)) setSelecao(selecao.filter(item => item !== id));
  else if (selecao.length < 3) setSelecao([...selecao, id]);
  else setErro('Seu hall tem três espaços. Remova um destaque para trocar.');
 }
 function mover(indice: number, direcao: number) {
  const copia = [...selecao], outro = indice + direcao;
  if (outro < 0 || outro >= copia.length) return;
  [copia[indice], copia[outro]] = [copia[outro], copia[indice]];
  setSelecao(copia);
 }
 async function salvar() {
  setSalvando(true); setErro('');
  try { await onSalvar(selecao); setEditando(false); }
  catch (falha) { setErro(falha instanceof Error ? falha.message : 'Não foi possível salvar o hall. Tente novamente.'); }
  finally { setSalvando(false); }
 }
 return <section className="hall-conquistas" aria-labelledby="hall-titulo">
  <header className="hall-cabecalho"><div>
   <h2 id="hall-titulo">Hall de conquistas</h2><p>{obtidas} de {painel.conquistas.length} emblemas obtidos</p></div>
   {!editando && <button className="hall-acao" onClick={() => { setSelecao([...painel.destaques]); setEditando(true); setErro(''); }}><Pencil size={15}/>Editar destaques</button>}
  </header>
  <div className="hall-podio" aria-label="Seus três destaques públicos">{[0, 1, 2].map(indice => {
   const item = painel.conquistas.find(c => c.badgeId === destaques[indice]);
   return <div className="hall-espaco" key={indice} data-vazio={!item}>
    <span className="hall-posicao">{String(indice + 1).padStart(2, '0')}</span>
    {item ? <><EmblemaConquista badgeId={item.badgeId} tamanho={86} animado/><strong>{item.titulo}</strong>
     <small>{nomesRaridades[item.raridade]}</small>{editando && <div className="hall-ordem">
      <button disabled={salvando || indice === 0} onClick={() => mover(indice, -1)} aria-label={`Mover ${item.titulo} para antes`}><ArrowLeft size={16}/></button>
      <button disabled={salvando} onClick={() => selecionar(item.badgeId)} aria-label={`Remover ${item.titulo} dos destaques`}><X size={16}/></button>
      <button disabled={salvando || indice === destaques.length - 1} onClick={() => mover(indice, 1)} aria-label={`Mover ${item.titulo} para depois`}><ArrowRight size={16}/></button>
     </div>}</> : <><span className="hall-vazio" aria-hidden="true">{indice + 1}</span><strong>Espaço para sua história</strong><small>{editando ? 'Escolha um emblema obtido abaixo' : 'Edite para destacar uma conquista'}</small></>}
   </div>;
  })}</div>
  {editando && <div className="hall-edicao"><p>Escolha até três emblemas obtidos. Use as setas para definir a ordem pública.</p>
   <button className="hall-acao" disabled={salvando} onClick={() => { setEditando(false); setErro(''); }}>Cancelar</button>
   <button className="hall-acao hall-salvar" disabled={salvando} onClick={salvar}>{salvando ? 'Salvando…' : 'Salvar destaques'}</button></div>}
  {erro && <p className="hall-erro" role="alert">{erro}</p>}
  <div className="hall-colecao">{painel.conquistas.map(item => {
   const ganhou = item.obtidaEm !== null, selecionado = destaques.includes(item.badgeId);
   return <article className="hall-cartao" key={item.badgeId} data-obtida={ganhou} data-raridade={item.raridade}>
    <EmblemaConquista badgeId={item.badgeId} tamanho={62} animado={ganhou} rotulo={false}/>
    <div className="hall-dados"><span className="hall-raridade">{nomesRaridades[item.raridade]}{ganhou ? ' · Obtida' : ' · A conquistar'}</span>
     <h3>{item.titulo}</h3><p>{item.descricao}</p>
     {ganhou ? <small>Obtida em {new Date(item.obtidaEm!).toLocaleDateString('pt-BR')}</small> : <div className="hall-progresso">
      <progress value={item.progresso} max={item.meta} aria-label={`${item.titulo}: ${item.progresso} de ${item.meta}`}/><small>{item.progresso} / {item.meta}</small></div>}
    </div>{editando && <button className="hall-selecionar" disabled={!ganhou || salvando} aria-pressed={selecionado}
     aria-label={`${selecionado ? 'Remover' : 'Destacar'} ${item.titulo}`} onClick={() => selecionar(item.badgeId)}>
     {!ganhou ? <LockKeyhole size={16}/> : selecionado ? <Check size={16}/> : <span aria-hidden="true">+</span>}</button>}
   </article>;
  })}</div>
 </section>;
}
