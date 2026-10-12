import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { buscar, enviar, definirToken } from '../util/api.js';
import ModalEntrar from '../componentes/ModalEntrar.jsx';

// Conta logada + modal de entrar/cadastrar acessível de qualquer tela
const Contexto = createContext(null);

export function ProvedorSessao({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [verificando, setVerificando] = useState(true);
  const [modal, setModal] = useState(null); // null | 'entrar' | 'cadastrar'

  useEffect(() => {
    buscar('/auth/eu', { semCache: true }).then(setUsuario).catch(() => definirToken(null)).finally(() => setVerificando(false));
  }, []);

  const concluir = ({ token, usuario: u }) => { definirToken(token); setUsuario(u); setModal(null); return u; };
  const entrar = (dados) => enviar('/auth/entrar', dados).then(concluir);
  const cadastrar = (dados) => enviar('/auth/cadastro', dados).then(concluir);
  const sair = useCallback(() => { definirToken(null); setUsuario(null); }, []);
  const atualizar = useCallback(() => buscar('/auth/eu', { semCache: true }).then(setUsuario).catch(() => {}), []);

  const valor = { usuario, verificando, entrar, cadastrar, sair, atualizar, setUsuario,
    abrirLogin: (aba = 'entrar') => setModal(aba), ehAdmin: usuario?.papel === 'admin' };

  return (
    <Contexto.Provider value={valor}>
      {children}
      {modal && <ModalEntrar aba={modal} trocarAba={setModal} aoFechar={() => setModal(null)} />}
    </Contexto.Provider>
  );
}
export const useSessao = () => useContext(Contexto);
