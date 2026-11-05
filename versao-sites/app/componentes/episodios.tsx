'use client';

import Image from 'next/image';
import { Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Episodio, Temporada } from '../../lib/servidor/temporadas';
import './episodios.css';

type Props = { tituloId: string; onReproduzir: (episodio: { id: string; titulo: string; videoUrl: string; poster?: string }) => void };
export function Episodios(props: Props) { return <ListaEpisodios key={props.tituloId} {...props} />; }
function ListaEpisodios({ tituloId, onReproduzir }: Props) {
    const [dados, setDados] = useState<{ temporadas: Temporada[]; episodios: Episodio[] } | null>(null);
    const [temporadaId, setTemporadaId] = useState('');
    const [erro, setErro] = useState('');
    const [versao, setVersao] = useState(0);
    useEffect(() => {
        const controle = new AbortController();
        void (async () => {
            try {
                const resposta = await fetch(`/api/yokira?acao=episodios&tituloId=${encodeURIComponent(tituloId)}`, { signal: controle.signal, cache: 'no-store' });
                const resultado = await resposta.json() as { temporadas: Temporada[]; episodios: Episodio[]; erro?: string; error?: string };
                if (!resposta.ok) throw new Error(resultado.erro || resultado.error || 'Não foi possível carregar os episódios.');
                if (!controle.signal.aborted) { setDados(resultado); setTemporadaId(resultado.temporadas[0]?.id || ''); }
            } catch (falha) { if (!controle.signal.aborted) setErro(falha instanceof Error ? falha.message : 'Não foi possível carregar os episódios.'); }
        })(); return () => controle.abort();
    }, [tituloId, versao]);
    const episodios = dados?.episodios.filter(e => temporadaId ? e.temporadaId === temporadaId : e.temporadaId === null) || [];
    return <section className="episodios-publicos" aria-label="Vídeos disponíveis">
        <div className="episodios-publicos-cabecalho"><h2>{dados?.temporadas.length ? 'Episódios' : 'Assistir'}</h2>{!!dados?.temporadas.length && <label htmlFor={`temporada-${tituloId}`}>Temporada<select id={`temporada-${tituloId}`} value={temporadaId} onChange={e => setTemporadaId(e.target.value)}>{dados.temporadas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}</select></label>}</div>
        {!dados && !erro && <p role="status">Carregando vídeos…</p>}
        {erro && <div role="alert"><p>{erro}</p><button className="button button-subtle" onClick={() => { setDados(null); setErro(''); setTemporadaId(''); setVersao(v => v + 1); }}>Tentar novamente</button></div>}
        {dados && !episodios.length && <p className="episodios-publicos-vazio">Ainda não há vídeos disponíveis para este título.</p>}
        <div className="episodios-publicos-lista">{episodios.map(ep => <button key={ep.id} className="episodios-publicos-item" onClick={() => onReproduzir({ id: ep.id, titulo: ep.titulo, videoUrl: ep.videoUrl, poster: ep.poster || undefined })} aria-label={`Assistir ${ep.temporadaId ? `episódio ${ep.numero}: ` : ''}${ep.titulo}`}>
            <span className="episodios-publicos-arte">{ep.poster && <Image src={ep.poster} alt="" width={280} height={158} loading="lazy" unoptimized />}<Play size={23} fill="currentColor" aria-hidden="true" /></span><span className="episodios-publicos-texto"><small>{ep.temporadaId ? `Episódio ${ep.numero} · ` : ''}{ep.duracao} min</small><strong>{ep.titulo}</strong>{ep.sinopse && <span>{ep.sinopse}</span>}</span><span className="episodios-publicos-assistir">Assistir</span>
        </button>)}</div>
    </section>;
}

export default Episodios;
