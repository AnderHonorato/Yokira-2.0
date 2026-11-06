'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { requisicaoSocial } from '../../lib/social-cliente';
import './moderacao-chat-global.css';

type Mensagem = { id: string; autorId: string; nome: string; corpo: string; imagemId: string | null; salaId: string | null; oculto: 0 | 1; criadoEm: number };
type Props = { administrador: boolean; notificar: (mensagem: string) => void };
export default function ModeracaoChatGlobal({ administrador, notificar }: Props) {
 const [mensagens, setMensagens] = useState<Mensagem[]>([]), [busca, setBusca] = useState(''), [consulta, setConsulta] = useState('');
 const [versao, setVersao] = useState(0), [carregando, setCarregando] = useState(true), [enviando, setEnviando] = useState(false);
 const [erro, setErro] = useState(''), [erroAcao, setErroAcao] = useState(''), [sucesso, setSucesso] = useState('');
 const [selecionada, setSelecionada] = useState<Mensagem | null>(null), [editar, setEditar] = useState(false);
 const [corpo, setCorpo] = useState(''), [motivo, setMotivo] = useState('');
 const mutacao = useRef<AbortController | null>(null), gatilho = useRef<HTMLButtonElement | null>(null);
 const restaurarFoco = useRef(false);
 const textoRef = useRef<HTMLTextAreaElement>(null), motivoRef = useRef<HTMLTextAreaElement>(null);
 useEffect(() => () => mutacao.current?.abort(), []);
 const selecionadaId = selecionada?.id;
 useEffect(() => { if (selecionadaId) (editar ? textoRef : motivoRef).current?.focus(); }, [selecionadaId, editar]);
 useEffect(() => { if (!selecionadaId && !carregando && restaurarFoco.current) { gatilho.current?.focus(); restaurarFoco.current = false; } }, [selecionadaId, carregando]);
 useEffect(() => {
  const abort = new AbortController();
  async function carregar() {
   setCarregando(true); setErro('');
   try {
    const r = await requisicaoSocial<{ mensagens: Mensagem[] }>({ acao: 'chat-global-moderacao', busca: consulta }, undefined, abort.signal);
    if (!abort.signal.aborted) setMensagens(r.mensagens);
   } catch (e) { if (!abort.signal.aborted) setErro(e instanceof Error ? e.message : 'Não foi possível carregar as mensagens.'); }
   finally { if (!abort.signal.aborted) setCarregando(false); }
  }
  void carregar(); return () => abort.abort();
 }, [consulta, versao]);
 function preparar(mensagem: Mensagem, edicao: boolean, botao: HTMLButtonElement) {
  gatilho.current = botao; setSelecionada(mensagem); setEditar(edicao); setCorpo(mensagem.corpo); setMotivo(''); setErroAcao(''); setSucesso('');
 }
 function cancelar() { restaurarFoco.current = true; setSelecionada(null); setErroAcao(''); }
 const textoValido = !editar || !!corpo.trim() || !!selecionada?.imagemId || !!selecionada?.salaId;
 async function confirmar(evento: FormEvent) {
  evento.preventDefault();
  if (!selecionada || mutacao.current || !textoValido || motivo.trim().length < 8 || (editar && !administrador)) return;
  const abort = new AbortController(); mutacao.current = abort; setEnviando(true); setErroAcao(''); setSucesso('');
  try {
   await requisicaoSocial(null, { acao: 'chat-global-moderar', id: selecionada.id, oculto: editar ? !!selecionada.oculto : !selecionada.oculto, motivo: motivo.trim(), ...(editar ? { corpo } : {}) }, abort.signal);
   if (abort.signal.aborted) return;
   restaurarFoco.current = true; setCarregando(true); setSelecionada(null); setMotivo(''); setVersao(v => v + 1); setSucesso('Alteração registrada na auditoria.');
   notificar('Mensagem do chat global moderada.');
  } catch (e) { if (!abort.signal.aborted) setErroAcao(e instanceof Error ? e.message : 'Não foi possível alterar a mensagem.'); }
  finally { if (!abort.signal.aborted) { mutacao.current = null; setEnviando(false); } }
 }
 const bloqueado = carregando || enviando;
 return <section className="moderacao-chat-global administracao-lista" aria-labelledby="moderacao-chat-global-titulo">
  <h2 id="moderacao-chat-global-titulo">Chat global</h2>
  <p className="administracao-ajuda">Até 100 mensagens recentes, incluindo as ocultas. Cada alteração exige um motivo e fica na auditoria.</p>
  <form className="administracao-busca" onSubmit={e => { e.preventDefault(); setConsulta(busca.trim()); setVersao(v => v + 1); }}>
   <label htmlFor="moderacao-chat-global-busca">Buscar por pessoa ou texto<input id="moderacao-chat-global-busca" value={busca} onChange={e => setBusca(e.target.value)} maxLength={100}/></label>
   <button className="button button-subtle" disabled={bloqueado}>Buscar</button><button className="button button-subtle" type="button" disabled={bloqueado} onClick={() => setVersao(v => v + 1)}>Atualizar</button>
  </form>
  {erro && <div className="administracao-aviso" role="alert"><p>{erro}</p><button type="button" className="button button-subtle" disabled={bloqueado} onClick={() => setVersao(v => v + 1)}>Tentar novamente</button></div>}
  {sucesso && <p className="administracao-aviso" role="status">{sucesso}</p>}
  {selecionada && <form className="administracao-confirmacao" aria-labelledby="moderacao-chat-global-acao" onSubmit={e => void confirmar(e)}>
   <h3 id="moderacao-chat-global-acao">{editar ? 'Editar texto da mensagem' : selecionada.oculto ? 'Restaurar mensagem' : 'Ocultar mensagem'}</h3>
   <p className="administracao-ajuda">Mensagem de {selecionada.nome}. {editar ? 'A visibilidade será preservada.' : 'A alteração afeta o texto, a foto e o convite desta mensagem.'}</p>
   {editar ? <label htmlFor="moderacao-chat-global-texto">Texto da mensagem<textarea ref={textoRef} id="moderacao-chat-global-texto" value={corpo} onChange={e => setCorpo(e.target.value)} maxLength={1000} disabled={enviando} aria-describedby="moderacao-chat-global-texto-ajuda"/><span id="moderacao-chat-global-texto-ajuda">{corpo.length}/1000 caracteres. {selecionada.imagemId || selecionada.salaId ? 'O texto pode ficar vazio porque a mensagem contém uma foto ou um convite.' : 'Escreva ao menos um caractere.'}</span></label> : <p className="administracao-resumo">{selecionada.corpo || (selecionada.imagemId ? 'Mensagem com foto.' : 'Convite de sala.')}</p>}
   <label htmlFor="moderacao-chat-global-motivo">Motivo da alteração<textarea ref={motivoRef} id="moderacao-chat-global-motivo" value={motivo} onChange={e => setMotivo(e.target.value)} minLength={8} maxLength={500} required disabled={enviando} aria-describedby="moderacao-chat-global-motivo-ajuda"/></label>
   <p id="moderacao-chat-global-motivo-ajuda" className="administracao-ajuda">De 8 a 500 caracteres. Este motivo será registrado na auditoria.</p>
   {erroAcao && <p className="administracao-aviso" role="alert">{erroAcao}</p>}
   <div className="administracao-acoes"><button type="button" className="button button-subtle" disabled={enviando} onClick={cancelar}>Cancelar</button><button className="button button-primary" disabled={bloqueado || !textoValido || motivo.trim().length < 8}>{enviando ? 'Registrando…' : 'Confirmar alteração'}</button></div>
  </form>}
  <div aria-busy={carregando}>
   {carregando && <p className="administracao-ajuda" role="status">Carregando mensagens…</p>}
   {!carregando && !erro && !mensagens.length && <p className="administracao-vazia">Nenhuma mensagem encontrada.</p>}
   {mensagens.map(m => <article key={m.id} className="administracao-item"><div className="administracao-item-corpo"><span className="administracao-selo">{m.oculto ? 'Oculta' : 'Visível'}</span><h3>{m.nome}</h3>{m.corpo && <p className="administracao-resumo">{m.corpo}</p>}<time dateTime={new Date(m.criadoEm).toISOString()}>{new Date(m.criadoEm).toLocaleString('pt-BR')}</time><p className="administracao-identificador">Mensagem: {m.id}</p>{m.salaId && <p className="administracao-identificador">Convite de sala: {m.salaId}</p>}{m.imagemId && <PreviaFoto imagemId={m.imagemId} nome={m.nome}/>}</div>
    <div className="administracao-acoes">{administrador && <button type="button" className="button button-subtle" disabled={bloqueado || !!selecionada} onClick={e => preparar(m, true, e.currentTarget)}>Editar texto</button>}<button type="button" className="button button-subtle" disabled={bloqueado || !!selecionada} onClick={e => preparar(m, false, e.currentTarget)}>{m.oculto ? 'Restaurar' : 'Ocultar'}</button></div>
   </article>)}
  </div>
 </section>;
}
function PreviaFoto({ imagemId, nome }: { imagemId: string; nome: string }) {
 const [aberta, setAberta] = useState(false), [falhou, setFalhou] = useState(false);
 return <div className="moderacao-chat-global-foto"><button type="button" className="button button-subtle" aria-expanded={aberta} onClick={() => { setAberta(v => !v); setFalhou(false); }}>{aberta ? 'Fechar prévia da foto' : 'Ver foto da mensagem'}</button>
  {aberta && (falhou ? <p role="status">Não foi possível carregar esta foto. Feche e abra a prévia para tentar novamente.</p> : <img src={'/api/comunidade/imagens/' + encodeURIComponent(imagemId)} alt={`Foto compartilhada por ${nome}`} onError={() => setFalhou(true)}/>)}
 </div>;
}
