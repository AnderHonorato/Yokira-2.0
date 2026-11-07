'use client';

import { useEffect, useState } from 'react';
import type { Episodio, Temporada } from '../../lib/servidor/temporadas';
import './editor-temporadas.css';
import type { FonteEpisodio } from '../../lib/servidor/fontes-episodio';
import { EditorFontes } from './editor-fontes';
import { EnviarMidia } from './enviar-midia';
import { useEnviosMidia } from './envios-midia';

type Acervo = { temporadas: Temporada[]; episodios: Episodio[] };
type FormEpisodio = { id?: string; temporadaId: string; numero: string; titulo: string; sinopse: string; duracao: string; videoUrl: string; poster: string; publicado: boolean; estreiaEm: string; arquivado: boolean; fontes: FonteEpisodio[] };
const novoEpisodio = (temporadaId = '', numero = 1): FormEpisodio => ({ temporadaId, numero: String(numero), titulo: '', sinopse: '', duracao: '24', videoUrl: '', poster: '', publicado: false, estreiaEm: '', arquivado: false, fontes: [] });
function dataLocal(ms: number | null) { if (ms === null) return ''; const d = new Date(ms); return new Date(ms - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }
type Props = { tituloId: string; tipo: 'Série' | 'Filme'; onOcupado?: (ocupado: boolean) => void; bloqueado?: boolean };
export function EditorTemporadas(props: Props) { return <EditorTemporadasConteudo key={props.tituloId} {...props} />; }
function EditorTemporadasConteudo({ tituloId, tipo, onOcupado, bloqueado: bloqueadoExterno = false }: Props) {
    const envios = useEnviosMidia(onOcupado);
    const [acervo, setAcervo] = useState<Acervo | null>(null);
    const [temporadaId, setTemporadaId] = useState('');
    const [temporadaForm, setTemporadaForm] = useState<{ id?: string; numero: string; nome: string; ordem: string; arquivado: boolean } | null>(null);
    const [ep, setEp] = useState<FormEpisodio | null>(null);
    const [motivo, setMotivo] = useState('');
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [versao, setVersao] = useState(0);
    const [agora, setAgora] = useState(() => Date.now());
    useEffect(() => {
        const controle = new AbortController();
        void (async () => {
            try {
                const resposta = await fetch(`/api/yokira?acao=temporadas-admin&tituloId=${encodeURIComponent(tituloId)}`, { cache: 'no-store', signal: controle.signal });
                const dados = await resposta.json() as Acervo & { erro?: string; error?: string };
                if (!resposta.ok) throw new Error(dados.erro || dados.error || 'Não foi possível carregar temporadas e vídeos.');
                if (!controle.signal.aborted) { setAgora(Date.now()); setAcervo(dados); setTemporadaId(atual => dados.temporadas.some((t: Temporada) => t.id === atual) ? atual : dados.temporadas.find((t: Temporada) => !t.arquivado)?.id || dados.temporadas[0]?.id || ''); }
            } catch (falha) { if (!controle.signal.aborted) setErro(falha instanceof Error ? falha.message : 'Falha ao carregar.'); }
            finally { if (!controle.signal.aborted) setCarregando(false); }
        })(); return () => controle.abort();
    }, [tituloId, versao]);
    const temporadas = acervo?.temporadas || [];
    const atual = temporadas.find(t => t.id === temporadaId);
    const episodios = (acervo?.episodios || []).filter(e => tipo === 'Filme' ? e.temporadaId === null : e.temporadaId === temporadaId);
    const bloqueioBase = carregando || salvando || bloqueadoExterno;
    const bloqueado = bloqueioBase || envios.ocupado;
    function atualizarEpisodio(campos: Partial<FormEpisodio>) { setEp(atual => atual ? { ...atual, ...campos } : atual); }
    function editarEpisodio(item: Episodio) { setEp({ ...item, fontes: item.fontes || [], temporadaId: item.temporadaId || '', numero: String(item.numero), duracao: String(item.duracao), estreiaEm: dataLocal(item.estreiaEm) }); setTemporadaForm(null); setMotivo(''); setSucesso(''); }
    async function salvar(evento: React.FormEvent, alvo: 'temporada' | 'episodio') {
        evento.preventDefault(); if (bloqueioBase || envios.temEnvios()) return; setSalvando(true); setErro(''); setSucesso('');
        try {
        const dados = alvo === 'temporada' && temporadaForm ? { ...temporadaForm, numero: Number(temporadaForm.numero), ordem: Number(temporadaForm.ordem) } : ep ? { ...ep, temporadaId: tipo === 'Filme' ? null : ep.temporadaId, numero: tipo === 'Filme' ? 1 : Number(ep.numero), duracao: Number(ep.duracao), estreiaEm: ep.estreiaEm ? new Date(ep.estreiaEm).toISOString() : null } : {};
            const resposta = await fetch('/api/yokira', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...dados, acao: `salvar-${alvo}`, tituloId, motivo }) });
            const resultado = await resposta.json() as { id: string; erro?: string; error?: string }; if (!resposta.ok) throw new Error(resultado.erro || resultado.error || 'Não foi possível salvar.');
            if (alvo === 'temporada') setTemporadaId(resultado.id);
            setTemporadaForm(null); setEp(null); setMotivo(''); setSucesso(alvo === 'temporada' ? 'Temporada salva.' : 'Vídeo salvo. Rascunhos e estreias futuras ficam fora da página pública.'); setCarregando(true); setVersao(v => v + 1);
        } catch (falha) { setErro(falha instanceof Error ? falha.message : 'Não foi possível salvar.'); }
        finally { setSalvando(false); }
    }
    const prefixo = `midia-${tituloId}-`;
    return <section className="editor-temporadas" aria-busy={bloqueado}>
        <header><span>CONTEÚDO PARA ASSISTIR</span><h2>{tipo === 'Filme' ? 'Vídeo do filme' : 'Temporadas e episódios'}</h2><p>{tipo === 'Filme' ? 'Cadastre o vídeo completo do filme, escolha a estreia e publique quando estiver pronto.' : 'Crie uma temporada e adicione os episódios com seus vídeos. Use os números para ordenar a exibição.'}</p></header>
        {erro && <div className="editor-temporadas-aviso" role="alert">{erro} <button type="button" className="button button-subtle" disabled={bloqueado} onClick={() => { setErro(''); setCarregando(true); setVersao(v => v + 1); }}>Recarregar</button></div>}
        {sucesso && <p className="editor-temporadas-aviso" role="status">{sucesso}</p>}
        {carregando && <p role="status">Carregando vídeos…</p>}
        {acervo && <>
            {tipo === 'Série' && <div className="editor-temporadas-toolbar"><label htmlFor={prefixo + 'selecao'}>Temporada<select id={prefixo + 'selecao'} value={temporadaId} disabled={bloqueado || !temporadas.length} onChange={e => { setTemporadaId(e.target.value); setEp(null); setTemporadaForm(null); setMotivo(''); }}><option value="" disabled>Selecione uma temporada</option>{temporadas.map(t => <option key={t.id} value={t.id}>{t.numero}. {t.nome}{t.arquivado ? ' · Arquivada' : ''}</option>)}</select></label>
                <button type="button" className="button button-subtle" disabled={bloqueado} onClick={() => { const numero = Math.max(0, ...temporadas.map(t => t.numero)) + 1; setTemporadaForm({ numero: String(numero), nome: `Temporada ${numero}`, ordem: String(numero), arquivado: false }); setEp(null); setMotivo(''); }}>Nova temporada</button>
                {atual && <button type="button" className="button button-subtle" disabled={bloqueado} onClick={() => { setTemporadaForm({ ...atual, numero: String(atual.numero), ordem: String(atual.ordem) }); setEp(null); setMotivo(''); }}>Editar temporada</button>}
            </div>}
            {!temporadas.length && tipo === 'Série' && <p>Comece em “Nova temporada”. Depois, cadastre os episódios abaixo.</p>}
            {temporadaForm && <form onSubmit={e => void salvar(e, 'temporada')}><fieldset disabled={bloqueioBase}><legend>{temporadaForm.id ? 'Editar temporada' : 'Nova temporada'}</legend><div className="editor-temporadas-campos">
                <label>Número<input type="number" min={1} max={10000} required value={temporadaForm.numero} onChange={e => setTemporadaForm({ ...temporadaForm, numero: e.target.value })} /></label>
                <label>Ordem de exibição<input type="number" min={1} max={100000} required value={temporadaForm.ordem} onChange={e => setTemporadaForm({ ...temporadaForm, ordem: e.target.value })} /></label>
                <label className="editor-temporadas-longo">Nome<input maxLength={200} required value={temporadaForm.nome} onChange={e => setTemporadaForm({ ...temporadaForm, nome: e.target.value })} /></label>
            </div><label className="editor-temporadas-check"><input type="checkbox" checked={temporadaForm.arquivado} onChange={e => setTemporadaForm({ ...temporadaForm, arquivado: e.target.checked })} />Arquivar temporada e ocultar seus episódios</label><p className="editor-temporadas-ajuda">Desmarque para restaurar. Episódios e históricos são preservados.</p>
                <label>Motivo da alteração<textarea minLength={3} maxLength={500} required value={motivo} onChange={e => setMotivo(e.target.value)} /></label>
                <div className="editor-temporadas-acoes"><button className="button button-primary" disabled={bloqueado || motivo.trim().length < 3}>{salvando ? 'Salvando…' : 'Salvar temporada'}</button><button type="button" className="button button-subtle" onClick={() => setTemporadaForm(null)}>Cancelar</button></div>
            </fieldset></form>}
            {(tipo === 'Filme' || atual) && <><div className="editor-temporadas-lista">{episodios.map(item => <button type="button" key={item.id} disabled={bloqueado} onClick={() => editarEpisodio(item)}><span><b>{tipo === 'Filme' ? item.titulo : `${item.numero}. ${item.titulo}`}</b><small>{item.duracao} min · {item.arquivado ? 'Arquivado' : !item.publicado ? 'Rascunho' : item.estreiaEm && item.estreiaEm > agora ? 'Estreia agendada' : 'Publicado'}{atual?.arquivado ? ' · Temporada arquivada' : ''}</small></span><span>Editar</span></button>)}</div>
                {!ep && (tipo !== 'Filme' || !episodios.length) && <button type="button" className="button button-primary" disabled={bloqueado || !!atual?.arquivado} onClick={() => { setEp(novoEpisodio(temporadaId, Math.max(0, ...episodios.map(e => e.numero)) + 1)); setTemporadaForm(null); setMotivo(''); }}>{tipo === 'Filme' ? 'Adicionar vídeo do filme' : 'Novo episódio'}</button>}
                {!episodios.length && !ep && <p className="editor-temporadas-ajuda">{tipo === 'Filme' ? 'Nenhum vídeo cadastrado para este filme.' : 'Esta temporada ainda não tem episódios.'}</p>}</>}
            {ep && <form key={ep.id || 'novo'} onSubmit={e => void salvar(e, 'episodio')}><fieldset disabled={bloqueioBase}><legend>{ep.id ? 'Editar vídeo' : tipo === 'Filme' ? 'Adicionar vídeo do filme' : 'Novo episódio'}</legend><div className="editor-temporadas-campos">
                {tipo === 'Série' && <><label>Temporada<select disabled={bloqueado} required value={ep.temporadaId} onChange={e => atualizarEpisodio({ temporadaId: e.target.value })}>{temporadas.map(t => <option key={t.id} value={t.id}>{t.nome}{t.arquivado ? ' · Arquivada' : ''}</option>)}</select></label><label>Número do episódio<input type="number" min={1} max={100000} required value={ep.numero} onChange={e => atualizarEpisodio({ numero: e.target.value })} /></label></>}
                <label className="editor-temporadas-longo">{tipo === 'Filme' ? 'Nome do filme no player' : 'Título do episódio'}<input required maxLength={200} value={ep.titulo} onChange={e => atualizarEpisodio({ titulo: e.target.value })} /></label>
                <label className="editor-temporadas-longo">Sinopse<textarea maxLength={5000} value={ep.sinopse} onChange={e => atualizarEpisodio({ sinopse: e.target.value })} rows={3} /></label>
                <label>Duração em minutos<input type="number" min={1} max={600} required value={ep.duracao} onChange={e => atualizarEpisodio({ duracao: e.target.value })} /></label>
                <label>Estreia (seu horário local)<input type="datetime-local" value={ep.estreiaEm} onChange={e => atualizarEpisodio({ estreiaEm: e.target.value })} /><small>Deixe vazio para disponibilizar ao publicar.</small></label>
                <EditorFontes onOcupado={(id, valor) => envios.ocupar('fonte:' + id, valor)} fontes={ep.fontes} alterar={atualizar => setEp(atual => atual ? { ...atual, fontes: atualizar(atual.fontes) } : atual)} bloqueado={bloqueado} />
                <label className="editor-temporadas-longo">Imagem do episódio (opcional)<input disabled={bloqueado} maxLength={2048} value={ep.poster} onChange={e => atualizarEpisodio({ poster: e.target.value })} placeholder="/arte/episodio.webp" /></label><div className="editor-temporadas-longo"><EnviarMidia key={ep.id || 'novo'} identidade={tituloId + (ep.id || 'novo') + ':poster'} tipo="imagem" disabled={bloqueado} onOcupado={valor => envios.ocupar('poster', valor)} onEnviado={poster => atualizarEpisodio({ poster })} /></div>
            </div><label className="editor-temporadas-check"><input type="checkbox" checked={ep.publicado} onChange={e => atualizarEpisodio({ publicado: e.target.checked })} />Publicar vídeo</label><p className="editor-temporadas-ajuda">Sem publicação, o vídeo fica em rascunho. Uma estreia futura só libera a reprodução a partir do horário escolhido. O título e a temporada também precisam estar visíveis.</p>
                <label className="editor-temporadas-check"><input type="checkbox" checked={ep.arquivado} onChange={e => atualizarEpisodio({ arquivado: e.target.checked })} />Arquivar vídeo</label><p className="editor-temporadas-ajuda">Desmarque para restaurar. O progresso das pessoas é preservado.</p>
                <label>Motivo da alteração<textarea minLength={3} maxLength={500} required value={motivo} onChange={e => setMotivo(e.target.value)} /></label><div className="editor-temporadas-acoes"><button className="button button-primary" disabled={bloqueado || motivo.trim().length < 3}>{salvando ? 'Salvando…' : 'Salvar vídeo'}</button><button type="button" className="button button-subtle" onClick={() => setEp(null)}>Cancelar</button></div>
            </fieldset></form>}
        </>}
    </section>;
}
