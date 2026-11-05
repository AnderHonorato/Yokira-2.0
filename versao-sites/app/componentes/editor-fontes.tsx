'use client';

import type { FonteEpisodio } from '../../lib/servidor/fontes-episodio';
import { EnviarMidia } from './enviar-midia';

type Props = { fontes: FonteEpisodio[]; alterar: (atualizar: (fontes: FonteEpisodio[]) => FonteEpisodio[]) => void; bloqueado: boolean };
export function EditorFontes({ fontes, alterar, bloqueado }: Props) {
    function atualizar(id: string, campos: Partial<FonteEpisodio>) { alterar(atuais => atuais.map(fonte => fonte.id === id ? { ...fonte, ...campos } : fonte)); }
    return <div className="editor-fontes editor-temporadas-longo">
        <h3>Servidores e fontes de reprodução</h3><p className="editor-temporadas-ajuda">Todas as fontes ativas aparecem para a pessoa escolher no player. Você pode oferecer seu servidor e provedores externos no mesmo episódio.</p>
        {fontes.map(fonte => <div key={fonte.id} className="editor-fontes-item"><div className="editor-temporadas-campos">
            <label>Nome exibido<input required maxLength={80} value={fonte.nome} onChange={e => atualizar(fonte.id, { nome: e.target.value })} placeholder="Servidor principal" /></label>
            <label>Tipo de reprodução<select value={fonte.tipo} onChange={e => atualizar(fonte.id, { tipo: e.target.value as FonteEpisodio['tipo'] })}><option value="direto">Servidor próprio / MP4 ou HLS</option><option value="drive">Google Drive</option><option value="incorporado">Player incorporado / outra nuvem</option></select></label>
            <label className="editor-temporadas-longo">{fonte.tipo === 'drive' ? 'Link do arquivo no Google Drive' : fonte.tipo === 'incorporado' ? 'URL do player incorporado' : 'URL do arquivo de vídeo'}<input required maxLength={2048} value={fonte.url} onChange={e => atualizar(fonte.id, { url: e.target.value })} placeholder={fonte.tipo === 'drive' ? 'https://drive.google.com/file/d/ID/view' : fonte.tipo === 'incorporado' ? 'https://player.provedor.com/embed/video' : 'https://seu-servidor/video.mp4'} /><small>{fonte.tipo === 'direto' ? 'MP4, WebM ou HLS: HTTPS sem credenciais ou caminho local.' : fonte.tipo === 'drive' ? 'Use um arquivo com acesso permitido ao público. O link é convertido para o player de prévia do Drive.' : 'Cole o endereço HTTPS de incorporação, sem código HTML. O provedor deve permitir abrir o vídeo em iframe.'}</small></label>
            {fonte.tipo === 'direto' && <div className="editor-temporadas-longo"><EnviarMidia tipo="video" onEnviado={url => atualizar(fonte.id, { url })} /></div>}
            <label>Ordem no player<input required type="number" min={1} max={1000} value={fonte.ordem} onChange={e => atualizar(fonte.id, { ordem: Number(e.target.value) })} /></label>
        </div><div className="editor-temporadas-acoes"><label className="editor-temporadas-check"><input type="checkbox" checked={fonte.ativo} onChange={e => atualizar(fonte.id, { ativo: e.target.checked })} />Fonte ativa</label><button type="button" className="button button-subtle" disabled={bloqueado} onClick={() => alterar(atuais => atuais.filter(atual => atual.id !== fonte.id))}>Remover fonte</button></div></div>)}
        <button type="button" className="button button-subtle" disabled={bloqueado || fontes.length >= 12} onClick={() => alterar(atuais => [...atuais, { id: crypto.randomUUID(), nome: `Servidor ${atuais.length + 1}`, tipo: 'direto', url: '', ordem: atuais.length + 1, ativo: true }])}>Adicionar fonte de vídeo</button>
        {!fontes.length && <p className="editor-temporadas-ajuda">Adicione ao menos uma fonte ativa para publicar. Um rascunho pode ficar sem vídeo.</p>}
    </div>;
}
