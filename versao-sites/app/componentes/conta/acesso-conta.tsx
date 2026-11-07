'use client';
import { useId, useState, type FormEvent } from 'react';
import './conta.css';

type Props = { aoEntrar: () => void; aoCancelar?: () => void; retorno?: string };
function retornoSeguro(valor: string) {
    const padrao = '/?p=perfil';
    if (!/^\/(?!\/)/.test(valor) || /[\\\u0000-\u001f\u007f]/.test(valor)) return padrao;
    try {
        const url = new URL(valor, 'https://app.local');
        if (url.origin !== 'https://app.local' || ['/signin-with-chatgpt', '/signout-with-chatgpt', '/callback'].includes(url.pathname)) return padrao;
        return url.pathname + url.search + url.hash;
    } catch { return padrao; }
}
export async function sairConta() {
    const resposta = await fetch('/api/auth/sign-out', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    if (!resposta.ok) throw new Error('Não foi possível sair. Tente novamente.');
}
export function AcessoConta({ aoEntrar, aoCancelar, retorno = '/?p=perfil' }: Props) {
    const id = useId();
    const [cadastro, setCadastro] = useState(false), [ocupado, setOcupado] = useState(false);
    const [erro, setErro] = useState(''), [nome, setNome] = useState(''), [email, setEmail] = useState('');
    const [senha, setSenha] = useState(''), [confirmacao, setConfirmacao] = useState(''), [visivel, setVisivel] = useState(false);
    const forca = [senha.length >= 12, /\p{Ll}/u.test(senha), /\p{Lu}/u.test(senha), /\p{N}/u.test(senha), /[^\p{L}\p{N}\s]/u.test(senha)].filter(Boolean).length;
    function sugerirSenha() {
        const alfabeto = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
        const bytes = crypto.getRandomValues(new Uint8Array(20));
        const sugestao = 'Ya!' + Array.from(bytes, b => alfabeto[b % 64]).join('') + '9';
        setSenha(sugestao); setConfirmacao(sugestao); setVisivel(true); setErro('');
    }
    async function enviar(evento: FormEvent<HTMLFormElement>) {
        evento.preventDefault();
        if (ocupado) return;
        setErro('');
        if (cadastro && senha !== confirmacao) { setErro('As senhas não coincidem.'); return; }
        if (cadastro && (senha.length < 12 || !/\p{Ll}/u.test(senha) || !/\p{Lu}/u.test(senha) || !/\p{N}/u.test(senha) || !/[^\p{L}\p{N}\s]/u.test(senha))) {
            setErro('Use de 12 a 128 caracteres, com maiúscula, minúscula, número e símbolo.'); return;
        }
        setOcupado(true);
        try {
            const resposta = await fetch(`/api/auth/${cadastro ? 'sign-up' : 'sign-in'}/email`, {
                method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), password: senha, ...(cadastro ? { name: nome.trim() } : {}) })
            });
            const dados = await resposta.json().catch(() => ({})) as { erro?: string };
            if (!resposta.ok) throw new Error(dados.erro || 'Não foi possível entrar. Tente novamente.');
            setSenha(''); setConfirmacao(''); aoEntrar();
        } catch (falha) { setErro(falha instanceof Error && !(falha instanceof TypeError) ? falha.message : 'Falha na conexão. Tente novamente.'); }
        finally { setOcupado(false); }
    }
    function alternar() { setCadastro(!cadastro); setErro(''); setSenha(''); setConfirmacao(''); }
    return <section className="conta-acesso" aria-labelledby={`${id}-titulo`}>
        <div className="conta-cabecalho"><h2 id={`${id}-titulo`}>{cadastro ? 'Criar conta' : 'Entrar com e-mail'}</h2>
            {aoCancelar && <button type="button" onClick={aoCancelar} disabled={ocupado}>Fechar</button>}</div>
        <form onSubmit={enviar} aria-busy={ocupado}>
            {cadastro && <label htmlFor={`${id}-nome`}>Nome de exibição<input id={`${id}-nome`} value={nome} onChange={e => setNome(e.target.value)} autoComplete="nickname" minLength={2} maxLength={60} required disabled={ocupado} placeholder="Como você quer aparecer" /></label>}
            <label htmlFor={`${id}-email`}>E-mail<input id={`${id}-email`} type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" maxLength={254} required disabled={ocupado} /></label>
            <label htmlFor={`${id}-senha`}>Senha<input id={`${id}-senha`} type={visivel ? 'text' : 'password'} value={senha} onChange={e => setSenha(e.target.value)} autoComplete={cadastro ? 'new-password' : 'current-password'} minLength={cadastro ? 12 : 1} maxLength={128} required disabled={ocupado} aria-describedby={cadastro ? `${id}-regras` : undefined} /></label>
            <button className="conta-alternar" type="button" onClick={() => setVisivel(!visivel)} aria-pressed={visivel}>{visivel ? 'Ocultar senha' : 'Mostrar senha'}</button>
            {cadastro && <><p id={`${id}-regras`} className="conta-ajuda">12 a 128 caracteres, com maiúscula, minúscula, número e símbolo.</p>
                <div className="conta-forca"><meter min={0} max={5} value={forca} aria-label="Força da senha"/><span>{!senha?'Digite uma senha':forca===5?'Senha forte':forca<3?'Senha fraca':'Complete os requisitos'}</span></div>
                <button className="conta-alternar" type="button" onClick={sugerirSenha} disabled={ocupado}>Sugerir senha forte</button>
                <label htmlFor={`${id}-confirmacao`}>Confirmar senha<input id={`${id}-confirmacao`} type={visivel ? 'text' : 'password'} value={confirmacao} onChange={e => setConfirmacao(e.target.value)} autoComplete="new-password" maxLength={128} required disabled={ocupado} /></label>
                <p className="conta-ajuda">Você poderá escolher seu @ no perfil após o cadastro. A verificação de e-mail e a recuperação de senha ainda não estão disponíveis.</p></>}
            {erro && <p className="conta-erro" role="alert">{erro}</p>}
            <button className="conta-enviar" type="submit" disabled={ocupado}>{ocupado ? 'Aguarde…' : cadastro ? 'Criar conta' : 'Entrar'}</button>
        </form>
        <button className="conta-alternar" type="button" onClick={alternar} disabled={ocupado}>{cadastro ? 'Já tenho conta' : 'Criar conta com e-mail'}</button>
        <a className="conta-chatgpt" href={'/signin-with-chatgpt?return_to=' + encodeURIComponent(retornoSeguro(retorno))} target="_top">Entrar com ChatGPT</a>
    </section>;
}
export default AcessoConta;
