'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { prepararImagem, type FinalidadeImagem } from './imagem-comunidade-preparo';
import './imagem-comunidade.css';

type Props = { finalidade: FinalidadeImagem; onEnviada: (url: string) => void; disabled?: boolean; compacto?: boolean; onOcupado?: (ocupado: boolean) => void };
export function ImagemComunidade({ finalidade, onEnviada, disabled = false, compacto = false, onOcupado }: Props) {
 const id = useId(), entrada = useRef<HTMLInputElement>(null), envio = useRef<XMLHttpRequest | null>(null), geracao = useRef(0);
 const callbacks = useRef({ onEnviada, onOcupado }), urlPrevia = useRef('');
 const [arquivo, setArquivo] = useState<File | null>(null), [previa, setPrevia] = useState('');
 const [ocupado, setOcupado] = useState(false), [progresso, setProgresso] = useState(0), [mensagem, setMensagem] = useState('');
 const [enviada, setEnviada] = useState(false);
 useEffect(() => { callbacks.current = { onEnviada, onOcupado }; }, [onEnviada, onOcupado]);
 useEffect(() => () => { geracao.current++; if (envio.current) { envio.current.onload = null; envio.current.onabort = null; envio.current.abort(); } callbacks.current.onOcupado?.(false); if (urlPrevia.current) URL.revokeObjectURL(urlPrevia.current); }, []);
 function selecionarArquivo(novo: File) { if (urlPrevia.current) URL.revokeObjectURL(urlPrevia.current); urlPrevia.current = URL.createObjectURL(novo); setArquivo(novo); setPrevia(urlPrevia.current); }
 function marcar(estado: boolean) { setOcupado(estado); callbacks.current.onOcupado?.(estado); }
 function cancelar() { geracao.current++; envio.current?.abort(); envio.current = null; marcar(false); setMensagem('Envio cancelado. Você pode tentar novamente.'); }
 async function enviar(origem: File | null) {
  if (!origem || ocupado || disabled) return;
  const tentativa = ++geracao.current; marcar(true); setEnviada(false); setMensagem('Preparando imagem…'); setProgresso(0);
  try {
   const pronta = await prepararImagem(origem, finalidade);
   if (tentativa !== geracao.current) return;
   selecionarArquivo(pronta); setMensagem('Enviando imagem…');
   const requisicao = new XMLHttpRequest(); envio.current = requisicao;
   const terminar = (texto: string) => { if (tentativa !== geracao.current) return; envio.current = null; marcar(false); setMensagem(texto); };
   requisicao.open('POST', '/api/comunidade/imagens'); requisicao.timeout = 60000;
   requisicao.setRequestHeader('Content-Type', pronta.type); requisicao.setRequestHeader('X-Finalidade', finalidade);
   requisicao.setRequestHeader('X-Tamanho-Arquivo', String(pronta.size));
   requisicao.upload.onprogress = evento => { if (tentativa === geracao.current && evento.lengthComputable) setProgresso(Math.round(evento.loaded / evento.total * 100)); };
   requisicao.onload = () => {
    if (tentativa !== geracao.current) return;
    let resposta: { url?: string; erro?: string } = {};
    try { resposta = JSON.parse(requisicao.responseText); } catch { /* Mensagem padrão abaixo. */ }
    if (requisicao.status >= 200 && requisicao.status < 300 && resposta.url?.startsWith('/api/comunidade/imagens/')) {
     terminar('Imagem enviada.'); setEnviada(true); callbacks.current.onEnviada(resposta.url);
    } else terminar(resposta.erro || 'Não foi possível enviar. Tente novamente.');
   };
   requisicao.onerror = () => terminar('A conexão falhou. Sua imagem continua aqui para tentar novamente.');
   requisicao.ontimeout = () => terminar('O envio demorou demais. Tente novamente.');
   requisicao.onabort = () => terminar('Envio cancelado. Você pode tentar novamente.');
   requisicao.send(pronta);
  } catch (erro) { if (tentativa === geracao.current) { marcar(false); setMensagem(erro instanceof Error ? erro.message : 'Não foi possível preparar a imagem. Tente novamente.'); } }
 }
 function escolher(selecionada?: File) {
  if (!selecionada) return;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(selecionada.type)) { setMensagem('Escolha JPEG, PNG ou WebP.'); return; }
  selecionarArquivo(selecionada); void enviar(selecionada);
 }
 return <div className="imagem-comunidade">
  <input ref={entrada} id={id} type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" disabled={disabled || ocupado}
   aria-label={`Escolher imagem para ${finalidade === 'avatar' ? 'foto de perfil' : finalidade === 'banner' ? 'capa do perfil' : 'o chat'}`}
   onChange={evento => { escolher(evento.target.files?.[0]); evento.target.value = ''; }} />
  <div className="imagem-comunidade-acoes">
   <button type="button" className="button button-secondary" disabled={disabled || ocupado} aria-label="Escolher imagem do dispositivo" onClick={() => entrada.current?.click()}>{compacto ? 'Foto' : 'Escolher imagem'}</button>
   {arquivo && !ocupado && !enviada && <button type="button" className="button button-secondary" disabled={disabled} onClick={() => void enviar(arquivo)}>Tentar novamente</button>}
   {ocupado && <button type="button" className="button button-secondary" onClick={cancelar}>Cancelar envio</button>}
  </div>
  {previa && (!compacto || !enviada) && <img className="imagem-comunidade-previa" src={previa} alt="Prévia da imagem selecionada" />}
  {ocupado && <progress value={progresso} max={100} aria-label="Progresso do envio da imagem" />}
  {!compacto && <p className="imagem-comunidade-ajuda">JPEG, PNG ou WebP. A imagem será reduzida antes do envio.</p>}
  {mensagem && <p className="imagem-comunidade-status" role="status" aria-live="polite">{mensagem}</p>}
 </div>;
}
export default ImagemComunidade;
