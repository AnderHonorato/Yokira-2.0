'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { Anime, Editorial } from '../../lib/catalogo';
import './editor-catalogo.css';
import { EditorTemporadas } from './editor-temporadas';
import { EnviarMidia } from './enviar-midia';
import { useEnviosMidia } from './envios-midia';

type ItemTitulo = Anime & { oculto: boolean };
type ItemEditorial = Editorial & { oculto: boolean };
type Acervo = { catalogo: ItemTitulo[]; editoriais: ItemEditorial[] };
type Props = { usuario: { id?: string; papel?: string; suspenso?: boolean } | null; notificar: (mensagem: string) => void; recarregar: () => void | Promise<void> };
type Campo = { nome: string; rotulo: string; tipo?: string; min?: number; max?: number; passo?: number; tamanho?: number; ajuda?: string; opcoes?: string[]; longo?: boolean; opcional?: boolean };
const camposTitulo: Campo[] = [
    { nome: 'nome', rotulo: 'Nome do título', tamanho: 200 },
    { nome: 'slug', rotulo: 'Endereço do título (slug)', tamanho: 120, ajuda: 'Gerado a partir do nome nos novos títulos. Você pode personalizar usando letras minúsculas, números e hífens.' },
    { nome: 'sinopse', rotulo: 'Sinopse', tamanho: 5000, longo: true },
    { nome: 'ano', rotulo: 'Ano', tipo: 'number', min: 1900, max: 2200 },
    { nome: 'estreia', rotulo: 'Ano de estreia', tipo: 'number', min: 1900, max: 2200, ajuda: 'O catálogo apresenta somente o ano de estreia.' },
    { nome: 'nota', rotulo: 'Nota editorial', tipo: 'number', min: 0, max: 10, passo: 0.1, ajuda: 'De 0 a 10, com até uma casa decimal.' },
    { nome: 'tipo', rotulo: 'Formato', opcoes: ['Série', 'Filme'] },
    { nome: 'status', rotulo: 'Status', opcoes: ['Completo', 'Em exibição', 'Em breve'] },
    { nome: 'episodios', rotulo: 'Total de episódios', tipo: 'number', min: 0, max: 100000, ajuda: 'Use 0 quando o total ainda não estiver verificado.' },
    { nome: 'duracao', rotulo: 'Duração em minutos', tipo: 'number', min: 1, max: 600 },
    { nome: 'generos', rotulo: 'Gêneros', tamanho: 520, ajuda: 'Separe de 1 a 12 categorias / gêneros por vírgula. Você pode criar categorias escrevendo novos nomes.' },
    { nome: 'poster', rotulo: 'Imagem do pôster', tamanho: 2048 },
    { nome: 'capa', rotulo: 'Imagem da capa', tamanho: 2048 }
];
const camposEditorial: Campo[] = [
    { nome: 'titulo', rotulo: 'Título editorial', tamanho: 200 },
    { nome: 'categoria', rotulo: 'Categoria', tamanho: 60 },
    { nome: 'data', rotulo: 'Data de publicação', tipo: 'date' },
    { nome: 'imagem', rotulo: 'Imagem editorial', tamanho: 2048 },
    { nome: 'resumo', rotulo: 'Resumo', tamanho: 1000, longo: true },
    { nome: 'corpo', rotulo: 'Texto completo', tamanho: 30000, longo: true, ajuda: 'Texto simples. Separe os parágrafos com uma linha em branco.' }
];
function formulario(item: ItemTitulo | ItemEditorial): Record<string, string> {
    return Object.fromEntries(Object.entries(item).filter(([chave]) => !['id', 'oculto'].includes(chave)).map(([chave, valor]) => [chave, Array.isArray(valor) ? valor.join(', ') : String(valor)]));
}
export default function EditorCatalogo({ usuario, notificar, recarregar }: Props) {
    const envios = useEnviosMidia();
    const permitido = !!usuario && usuario.papel === 'administrador' && !usuario.suspenso;
    const [acervo, setAcervo] = useState<Acervo | null>(null);
    const [tipo, setTipo] = useState<'titulo' | 'editorial'>('titulo');
    const [alvoId, setAlvoId] = useState('');
    const [criando, setCriando] = useState(false);
    const slugPersonalizado = useRef(false);
    const selecao = useRef({ tipo: 'titulo' as 'titulo' | 'editorial', id: '', criando: false });
    const [form, setForm] = useState<Record<string, string>>({});
    const [oculto, setOculto] = useState(false);
    const [motivo, setMotivo] = useState('');
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');
    const [carregando, setCarregando] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [versao, setVersao] = useState(0);
    useEffect(() => {
        if (!permitido) return;
        const controle = new AbortController();
        async function carregar() {
            setCarregando(true); setErro('');
            try {
                const resposta = await fetch('/api/yokira?acao=acervo-admin', { signal: controle.signal, cache: 'no-store' });
                const resultado = await resposta.json() as Acervo & { erro?: string; error?: string };
                if (!resposta.ok) throw new Error(resultado.erro || resultado.error || 'Não foi possível carregar o acervo.');
                setAcervo(resultado);
                if (!selecao.current.criando) {
                    const itens = selecao.current.tipo === 'titulo' ? resultado.catalogo : resultado.editoriais;
                    const item = itens.find(valor => valor.id === selecao.current.id) || itens[0];
                    if (item) { selecao.current.id = item.id; setAlvoId(item.id); setForm(formulario(item)); setOculto(item.oculto); setMotivo(''); }
                }
            } catch (falha) { if (!controle.signal.aborted) setErro(falha instanceof Error ? falha.message : 'Não foi possível carregar o acervo.'); }
            finally { if (!controle.signal.aborted) setCarregando(false); }
        }
        void carregar(); return () => controle.abort();
    }, [permitido, usuario?.id, versao]);
    function selecionar(novoTipo: typeof tipo, id = '') {
        if (envios.temEnvios()) return;
        const itens = novoTipo === 'titulo' ? acervo?.catalogo : acervo?.editoriais;
        const item = itens?.find(valor => valor.id === id) || itens?.[0];
        slugPersonalizado.current = true;
        selecao.current = { tipo: novoTipo, id: item?.id || '', criando: false };
        setTipo(novoTipo); setCriando(false); setAlvoId(item?.id || ''); setErro(''); setSucesso(''); setMotivo('');
        if (item) { setForm(formulario(item)); setOculto(item.oculto); }
    }
    function atualizarCampo(chave: string, valor: string) {
        if (chave === 'slug') slugPersonalizado.current = true;
        setForm(atual => ({ ...atual, [chave]: valor, ...(criando && chave === 'nome' && !slugPersonalizado.current ? { slug: valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 120).replace(/^-+|-+$/g, '') } : {}) }));
    }
    function novo(formato: 'Série' | 'Filme') {
        if (envios.temEnvios()) return;
        slugPersonalizado.current = false;
        selecao.current = { tipo: 'titulo', id: '', criando: true };
        setTipo('titulo'); setCriando(true); setAlvoId(''); setOculto(true); setMotivo(''); setErro(''); setSucesso('');
        const ano = String(new Date().getFullYear());
        setForm({ nome: '', slug: '', sinopse: '', ano, estreia: ano, nota: '0', tipo: formato, status: 'Em breve', episodios: formato === 'Filme' ? '1' : '0', duracao: formato === 'Filme' ? '90' : '24', generos: '', poster: '', capa: '', video: '' });
    }
    async function salvar(evento: React.FormEvent<HTMLFormElement>) {
        evento.preventDefault();
        if (!permitido || enviando || envios.temEnvios() || (!alvoId && !criando) || motivo.trim().length < 3) return;
        setEnviando(true); setErro(''); setSucesso('');
        const dados: Record<string, unknown> = { ...form };
        if (tipo === 'titulo') {
            for (const chave of ['ano', 'nota', 'episodios', 'duracao']) dados[chave] = Number(form[chave]);
            dados.generos = form.generos.split(',').map(valor => valor.trim());
            if (!form.video?.trim()) delete dados.video;
        }
        try {
            const resposta = await fetch('/api/yokira', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ acao: 'salvar-acervo', tipo, ...(criando ? {} : { alvoId }), dados, oculto, motivo: motivo.trim() }) });
            const resultado = await resposta.json() as { id?: string; erro?: string; error?: string };
            if (!resposta.ok) throw new Error(resultado.erro || resultado.error || 'Não foi possível salvar as alterações.');
            setSucesso('Conteúdo salvo. A alteração e seu motivo foram registrados na auditoria.'); setMotivo('');
            notificar('Acervo atualizado com sucesso.');
            selecao.current = { tipo, id: resultado.id || alvoId, criando: false };
            setAcervo(null); setAlvoId(resultado.id || alvoId); setCriando(false); setVersao(valor => valor + 1);
            try { await recarregar(); } catch { notificar('Conteúdo salvo. Atualize a página para ver a versão pública.'); }
        } catch (falha) { setErro(falha instanceof Error ? falha.message : 'Não foi possível salvar as alterações.'); }
        finally { setEnviando(false); }
    }
    if (!usuario) return <section className="editor-acervo"><h1>Entre para editar o acervo</h1><p>Use sua conta de administrador para continuar.</p><a className="button button-primary" href="/signin-with-chatgpt?return_to=%2F%3Fp%3Dacervo-admin" target="_top">Entrar com ChatGPT</a></section>;
    if (!permitido) return <section className="editor-acervo"><h1>Acesso restrito</h1><p>{usuario.suspenso ? 'Sua conta está suspensa.' : 'A edição do acervo está disponível para administradores.'}</p><Link className="button button-subtle" href="/?p=perfil">Voltar ao perfil</Link></section>;
    const itens = tipo === 'titulo' ? acervo?.catalogo : acervo?.editoriais;
    const bloqueado = carregando || enviando || envios.ocupado;
    const tituloSalvo = tipo === 'titulo' && !criando ? acervo?.catalogo.find(item => item.id === alvoId) : undefined;
    return <section className="editor-acervo">
        <header className="editor-acervo-cabecalho"><span>YOKIRA / ADMINISTRAÇÃO</span><h1>Editar acervo</h1><p>Crie séries e filmes ou atualize títulos, imagens e textos editoriais. Toda alteração exige um motivo e fica registrada.</p><Link href="/?p=admin">Abrir painel de moderação</Link></header>
        <div className="editor-acervo-acoes editor-acervo-novo"><button type="button" className="button button-subtle" disabled={bloqueado} onClick={() => novo('Série')}>Nova série</button><button type="button" className="button button-subtle" disabled={bloqueado} onClick={() => novo('Filme')}>Novo filme</button></div>
        <div className="editor-acervo-selecao">
            <label htmlFor="acervo-tipo">Conteúdo<select id="acervo-tipo" value={tipo} disabled={bloqueado} onChange={evento => selecionar(evento.target.value as typeof tipo)}><option value="titulo">Títulos do catálogo</option><option value="editorial">Editoriais</option></select></label>
            <label htmlFor="acervo-item">Selecionar para editar<select id="acervo-item" value={alvoId} disabled={bloqueado || !itens?.length} onChange={evento => selecionar(tipo, evento.target.value)}>{criando && <option value="">Novo conteúdo · Rascunho</option>}{!itens?.length && !criando && <option value="">Nenhum conteúdo disponível</option>}{itens?.map(item => <option key={item.id} value={item.id}>{'nome' in item ? item.nome : item.titulo}{item.oculto ? ' · Oculto' : ''}</option>)}</select></label>
        </div>
        {erro && <div className="editor-acervo-aviso" role="alert"><p>{erro}</p>{!acervo && <button className="button button-subtle" disabled={bloqueado} onClick={() => setVersao(valor => valor + 1)}>Tentar novamente</button>}</div>}
        {sucesso && <p className="editor-acervo-aviso" role="status">{sucesso}</p>}
        {carregando && <p role="status">Carregando acervo…</p>}
        {(criando || (acervo && alvoId)) && <form onSubmit={salvar} aria-busy={bloqueado} className="editor-acervo-form">
            <fieldset disabled={carregando || enviando}><legend>{tipo === 'titulo' ? 'Dados do título' : 'Dados editoriais'}</legend>
                <p className="editor-acervo-ajuda">Envie imagens do dispositivo ou informe um caminho local (ex.: /arte/imagem.webp) ou URL HTTPS sem credenciais. As alterações só são publicadas ao salvar.</p>
                {tipo === 'titulo' && <p className="editor-acervo-ajuda">{criando ? 'Salve o título para cadastrar seus vídeos nas temporadas ou no filme abaixo.' : 'Cadastre os vídeos nas temporadas ou no filme, na seção abaixo.'}</p>}
                <div className="editor-acervo-campos">{(tipo === 'titulo' ? camposTitulo : camposEditorial).map(campo => {
                    const id = 'acervo-' + campo.nome;
                    const comuns = { id, disabled: bloqueado, name: campo.nome, value: form[campo.nome] || '', onChange: (evento: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => atualizarCampo(campo.nome, evento.target.value), required: !campo.opcional, 'aria-describedby': campo.ajuda ? id + '-ajuda' : undefined };
                    return <div key={tipo + ':' + (alvoId || form.tipo) + ':' + campo.nome} className={campo.longo ? 'editor-acervo-longo' : undefined}><label htmlFor={id}>{campo.rotulo}
                        {campo.opcoes ? <select {...comuns}>{campo.opcoes.map(opcao => <option key={opcao}>{opcao}</option>)}</select> : campo.longo ? <textarea {...comuns} maxLength={campo.tamanho} rows={campo.nome === 'corpo' ? 16 : 4} minLength={10} /> : <input {...comuns} type={campo.tipo || 'text'} min={campo.min} max={campo.max} step={campo.passo || 1} maxLength={campo.tamanho} />}
                        {campo.ajuda && <small id={id + '-ajuda'}>{campo.ajuda}</small>}
                    </label>{['poster', 'capa', 'imagem'].includes(campo.nome) && <EnviarMidia key={tipo + alvoId + campo.nome} identidade={tipo + alvoId + campo.nome} tipo="imagem" disabled={bloqueado} onOcupado={valor => envios.ocupar(campo.nome, valor)} onEnviado={url => setForm(atual => ({ ...atual, [campo.nome]: url }))} />}</div>;
                })}</div>
                <label className="editor-acervo-disponibilidade" htmlFor="acervo-oculto"><input id="acervo-oculto" type="checkbox" disabled={bloqueado} checked={oculto} onChange={evento => setOculto(evento.target.checked)} />Ocultar da versão pública</label><p className="editor-acervo-ajuda">O conteúdo oculto continua disponível neste editor para correções e restauração.</p>
                <label htmlFor="acervo-motivo">Motivo da alteração<textarea disabled={bloqueado} id="acervo-motivo" value={motivo} onChange={evento => setMotivo(evento.target.value)} required minLength={3} maxLength={500} rows={3} aria-describedby="acervo-motivo-ajuda" /></label><small id="acervo-motivo-ajuda">De 3 a 500 caracteres. Explique o que foi alterado para a auditoria.</small>
            </fieldset>
            <div className="editor-acervo-acoes"><button className="button button-primary" disabled={bloqueado || motivo.trim().length < 3}>{enviando ? 'Salvando…' : 'Salvar alterações'}</button><span>{oculto ? 'Será mantido oculto' : 'Será exibido ao público'}</span></div>
        </form>}
        {tituloSalvo && <EditorTemporadas onOcupado={valor => envios.ocupar('temporadas', valor)} bloqueado={carregando || enviando} key={tituloSalvo.id} tituloId={tituloSalvo.id} tipo={tituloSalvo.tipo} />}
    </section>;
}
