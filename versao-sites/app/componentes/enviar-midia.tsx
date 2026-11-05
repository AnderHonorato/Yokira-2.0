'use client';

import { useEffect, useId, useRef, useState } from 'react';
import './enviar-midia.css';

type Props = { tipo: 'video' | 'imagem'; onEnviado: (url: string) => void };
const limite = 100 * 1024 * 1024;
const formatos = { video: '.mp4,.webm,video/mp4,video/webm', imagem: '.png,.jpg,.jpeg,.webp,.avif,image/png,image/jpeg,image/webp,image/avif' };
const tipos: Record<string, string> = { mp4: 'video/mp4', webm: 'video/webm', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', avif: 'image/avif' };
export function EnviarMidia({ tipo, onEnviado }: Props) {
    const id = useId(), envio = useRef<XMLHttpRequest | null>(null), seletor = useRef<HTMLInputElement>(null);
    const aoEnviar = useRef(onEnviado);
    const [progresso, setProgresso] = useState(0), [enviando, setEnviando] = useState(false), [mensagem, setMensagem] = useState('');
    useEffect(() => { aoEnviar.current = onEnviado; }, [onEnviado]);
    useEffect(() => () => { if (envio.current) { envio.current.onload = null; envio.current.onabort = null; envio.current.abort(); } }, []);
    function enviar(arquivo?: File) {
        if (!arquivo || envio.current) return;
        setMensagem('');
        if (!arquivo.size || arquivo.size > limite) { setMensagem('Escolha um arquivo de até 100 MiB. Para arquivos maiores, use uma URL externa.'); return; }
        const requisicao = new XMLHttpRequest();
        envio.current = requisicao; setEnviando(true); setProgresso(0);
        const finalizar = (texto: string) => { envio.current = null; setEnviando(false); setMensagem(texto); if (seletor.current) seletor.current.value = ''; };
        requisicao.open('POST', '/api/midia');
        requisicao.setRequestHeader('Content-Type', arquivo.type || tipos[arquivo.name.split('.').at(-1)?.toLowerCase() || ''] || 'application/octet-stream');
        requisicao.setRequestHeader('X-Nome-Arquivo', encodeURIComponent(arquivo.name));
        // Content-Length é controlado pelo navegador; o servidor também confere o fluxo real.
        requisicao.setRequestHeader('X-Tamanho-Arquivo', String(arquivo.size));
        requisicao.upload.onprogress = evento => { if (evento.lengthComputable) setProgresso(Math.round(evento.loaded / evento.total * 100)); };
        requisicao.onload = () => {
            let resposta: { url?: string; erro?: string } = {};
            try { resposta = JSON.parse(requisicao.responseText); } catch { /* Mensagem padrão abaixo. */ }
            if (requisicao.status >= 200 && requisicao.status < 300 && resposta.url) { finalizar('Arquivo enviado. Salve o formulário para associá-lo ao conteúdo.'); aoEnviar.current(resposta.url); }
            else finalizar(resposta.erro || 'Não foi possível enviar o arquivo. Tente novamente.');
        };
        requisicao.onerror = () => finalizar('A conexão falhou. Confira sua internet e tente novamente.');
        requisicao.onabort = () => finalizar('Envio cancelado.');
        requisicao.ontimeout = () => finalizar('O envio demorou demais. Tente novamente ou use uma URL externa.');
        requisicao.send(arquivo);
    }
    return <div className="enviar-midia">
        <input className="sr-only" ref={seletor} id={id} type="file" aria-label={`Selecionar ${tipo === 'video' ? 'vídeo' : 'imagem'} para enviar`} accept={formatos[tipo]} disabled={enviando} onChange={evento => enviar(evento.target.files?.[0])} />
        <div className="enviar-midia-acoes">
            <button type="button" className="button button-secondary" disabled={enviando} onClick={() => seletor.current?.click()}>Enviar {tipo === 'video' ? 'vídeo' : 'imagem'} do dispositivo</button>
            {enviando && <button type="button" className="button button-secondary" onClick={() => envio.current?.abort()}>Cancelar envio</button>}
        </div>
        <p className="enviar-midia-ajuda">Até 100 MiB por arquivo. {tipo === 'video' ? 'MP4 ou WebM.' : 'PNG, JPEG, WebP ou AVIF.'} Para arquivos maiores, preencha a URL externa no formulário.</p>
        {enviando && <div className="enviar-midia-progresso"><progress value={progresso} max={100} aria-label="Progresso do envio" /><span role="status">{progresso < 100 ? `Enviando: ${progresso}%` : 'Concluindo o envio…'}</span></div>}
        {mensagem && <p role="status" className="enviar-midia-mensagem">{mensagem}</p>}
    </div>;
}
export default EnviarMidia;
