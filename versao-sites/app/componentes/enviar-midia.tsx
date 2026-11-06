'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import './enviar-midia.css';

type Props = { tipo: 'video' | 'imagem'; identidade?: string; onEnviado: (url: string) => void; onOcupado?: (ocupado: boolean) => void; disabled?: boolean };
const limite = 100 * 1024 * 1024;
const formatos = { video: '.mp4,.webm,video/mp4,video/webm', imagem: '.png,.jpg,.jpeg,.webp,.avif,image/png,image/jpeg,image/webp,image/avif' };
const tipos: Record<string, string> = { mp4: 'video/mp4', webm: 'video/webm', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', avif: 'image/avif' };
export function EnviarMidia(props: Props) { return <EnvioMidia key={props.identidade || props.tipo} {...props} />; }
function EnvioMidia({ tipo, identidade = tipo, onEnviado, onOcupado, disabled = false }: Props) {
    const id = useId(), envio = useRef<XMLHttpRequest | null>(null), seletor = useRef<HTMLInputElement>(null), geracao = useRef(0);
    const callbacks = useRef({ onEnviado, onOcupado });
    const [progresso, setProgresso] = useState(0), [enviando, setEnviando] = useState(false), [mensagem, setMensagem] = useState('');
    useEffect(() => { callbacks.current = { onEnviado, onOcupado }; }, [onEnviado, onOcupado]);
    useLayoutEffect(() => () => {
        geracao.current++;
        if (envio.current) {
            const requisicao = envio.current; envio.current = null;
            requisicao.onload = requisicao.onerror = requisicao.onabort = requisicao.ontimeout = null;
            requisicao.upload.onprogress = null; requisicao.abort(); callbacks.current.onOcupado?.(false);
        }
    }, [identidade]);
    function enviar(arquivo?: File) {
        if (!arquivo || envio.current || disabled) return;
        setMensagem('');
        if (!arquivo.size || arquivo.size > limite) { setMensagem('Escolha um arquivo de até 100 MiB. Para arquivos maiores, use uma URL externa.'); return; }
        const requisicao = new XMLHttpRequest();
        const tentativa = ++geracao.current, destino = callbacks.current;
        envio.current = requisicao; setEnviando(true); setProgresso(0); destino.onOcupado?.(true);
        const atual = () => tentativa === geracao.current && envio.current === requisicao;
        const finalizar = (texto: string, url?: string) => {
            if (!atual()) return;
            envio.current = null; setEnviando(false); setMensagem(texto); if (seletor.current) seletor.current.value = '';
            if (url) destino.onEnviado(url);
            destino.onOcupado?.(false);
        };
        try {
            requisicao.open('POST', '/api/midia');
            requisicao.timeout = 120000;
            requisicao.setRequestHeader('Content-Type', arquivo.type || tipos[arquivo.name.split('.').at(-1)?.toLowerCase() || ''] || 'application/octet-stream');
            requisicao.setRequestHeader('X-Nome-Arquivo', encodeURIComponent(arquivo.name));
            // Content-Length é controlado pelo navegador; o servidor também confere o fluxo real.
            requisicao.setRequestHeader('X-Tamanho-Arquivo', String(arquivo.size));
            requisicao.upload.onprogress = evento => { if (atual() && evento.lengthComputable) setProgresso(Math.round(evento.loaded / evento.total * 100)); };
            requisicao.onload = () => {
                if (!atual()) return;
                let resposta: { url?: string; erro?: string } = {};
                try { resposta = JSON.parse(requisicao.responseText); } catch { /* Mensagem padrão abaixo. */ }
                if (requisicao.status >= 200 && requisicao.status < 300 && /^\/api\/midia\/[a-f0-9-]+$/i.test(resposta.url || '')) finalizar('Arquivo enviado. Salve o formulário para associá-lo ao conteúdo.', resposta.url);
                else finalizar(resposta.erro || 'Não foi possível enviar o arquivo. Tente novamente.');
            };
            requisicao.onerror = () => finalizar('A conexão falhou. Confira sua internet e tente novamente.');
            requisicao.onabort = () => finalizar('Envio cancelado.');
            requisicao.ontimeout = () => finalizar('O envio demorou demais. Tente novamente ou use uma URL externa.');
            requisicao.send(arquivo);
        } catch { finalizar('Não foi possível iniciar o envio. Tente novamente.'); }
    }
    return <div className="enviar-midia">
        <input className="sr-only" ref={seletor} id={id} type="file" aria-label={`Selecionar ${tipo === 'video' ? 'vídeo' : 'imagem'} para enviar`} accept={formatos[tipo]} disabled={disabled || enviando} onChange={evento => enviar(evento.target.files?.[0])} />
        <div className="enviar-midia-acoes">
            <button type="button" className="button button-secondary" disabled={disabled || enviando} onClick={() => seletor.current?.click()}>Enviar {tipo === 'video' ? 'vídeo' : 'imagem'} do dispositivo</button>
            {enviando && <button type="button" className="button button-secondary" onClick={() => envio.current?.abort()}>Cancelar envio</button>}
        </div>
        <p className="enviar-midia-ajuda">Até 100 MiB por arquivo. {tipo === 'video' ? 'MP4 ou WebM.' : 'PNG, JPEG, WebP ou AVIF.'} Para arquivos maiores, preencha a URL externa no formulário.</p>
        {enviando && <div className="enviar-midia-progresso"><progress value={progresso} max={100} aria-label="Progresso do envio" /><span role="status">{progresso < 100 ? `Enviando: ${progresso}%` : 'Concluindo o envio…'}</span></div>}
        {mensagem && <p role="status" className="enviar-midia-mensagem">{mensagem}</p>}
    </div>;
}
export default EnviarMidia;
