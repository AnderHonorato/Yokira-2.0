import { useEffect, useRef, useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { useSessao } from '../ganchos/useSessao.jsx';
import { useAvisos } from '../ganchos/useAvisos.jsx';
import './ModalEntrar.css';

export default function ModalEntrar({ aba, trocarAba, aoFechar }) {
  const { entrar, cadastrar } = useSessao();
  const avisar = useAvisos();
  const [form, setForm] = useState({ nome: '', email: '', senha: '' });
  const [verSenha, setVerSenha] = useState(false);
  const [estado, setEstado] = useState({ enviando: false, erro: null });
  const primeiro = useRef(null);
  const cadastro = aba === 'cadastrar';

  useEffect(() => {
    primeiro.current?.focus();
    const esc = (e) => e.key === 'Escape' && aoFechar();
    addEventListener('keydown', esc);
    return () => removeEventListener('keydown', esc);
  }, [aba, aoFechar]);

  const mudar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });
  const enviarForm = async (e) => {
    e.preventDefault();
    setEstado({ enviando: true, erro: null });
    try {
      const u = await (cadastro ? cadastrar(form) : entrar({ email: form.email, senha: form.senha }));
      avisar(cadastro ? `Conta criada. Bem-vindo, ${u.nome}! +50 XP` : `Olá de novo, ${u.nome}`, cadastro ? 'xp' : 'ok');
    } catch (err) { setEstado({ enviando: false, erro: err.message }); }
  };

  return (
    <div className="modal-fundo" onMouseDown={aoFechar}>
      <div className="modal-entrar" role="dialog" aria-modal="true" aria-labelledby="entrar-titulo" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-entrar-arte" aria-hidden="true"><span /><span /><span /></div>
        <button className="btn btn-icone modal-fechar" onClick={aoFechar} aria-label="Fechar"><X size={18} /></button>
        <h2 id="entrar-titulo">{cadastro ? 'Crie sua conta' : 'Bem-vindo de volta'}</h2>
        <p className="modal-entrar-sub">{cadastro ? 'Salve sua lista, converse no chat e suba no ranking.' : 'Entre para continuar de onde parou.'}</p>
        <div className="modal-abas" role="tablist">
          <button role="tab" aria-selected={!cadastro} onClick={() => trocarAba('entrar')}>Entrar</button>
          <button role="tab" aria-selected={cadastro} onClick={() => trocarAba('cadastrar')}>Criar conta</button>
        </div>
        <form onSubmit={enviarForm} className="modal-form" key={aba}>
          {cadastro && <label>Nome de exibição<input ref={primeiro} value={form.nome} onChange={mudar('nome')} autoComplete="nickname" minLength={3} maxLength={24} required /></label>}
          <label>E-mail<input ref={cadastro ? null : primeiro} type="email" value={form.email} onChange={mudar('email')} autoComplete="email" required /></label>
          <label>Senha
            <span className="campo-senha">
              <input type={verSenha ? 'text' : 'password'} value={form.senha} onChange={mudar('senha')} autoComplete={cadastro ? 'new-password' : 'current-password'} minLength={6} required />
              <button type="button" onClick={() => setVerSenha(!verSenha)} aria-label={verSenha ? 'Esconder senha' : 'Mostrar senha'}>{verSenha ? <EyeOff size={17} /> : <Eye size={17} />}</button>
            </span>
            {cadastro && <small>Mínimo de 6 caracteres.</small>}
          </label>
          {estado.erro && <p className="modal-erro" role="alert">{estado.erro}</p>}
          <button className="btn btn-primario modal-enviar" disabled={estado.enviando}>
            {estado.enviando ? 'Aguarde…' : cadastro ? 'Criar conta' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
