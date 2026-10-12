import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { buscar, enviar } from '../util/api.js';
import { useSessao } from './useSessao.jsx';

// Lista, favoritos e progresso de episódios do usuário, salvos no navegador.
// Com login, a biblioteca é carregada da conta e sincronizada com a API.
const CHAVE = 'yokira:biblioteca';
const inicial = { lista: {}, favoritos: {}, progresso: {}, assistidos: {} };
const Contexto = createContext(null);

function carregar() {
  try { return { ...inicial, ...JSON.parse(localStorage.getItem(CHAVE)) }; } catch { return inicial; }
}

export function ProvedorBiblioteca({ children }) {
  const [dados, setDados] = useState(carregar);
  const { usuario } = useSessao();
  const sincronizado = useRef(false);
  useEffect(() => { try { localStorage.setItem(CHAVE, JSON.stringify(dados)); } catch { /* sem espaço */ } }, [dados]);

  // Ao entrar: junta o que estava no navegador com o que está na conta
  useEffect(() => {
    sincronizado.current = false;
    if (!usuario) return;
    buscar('/biblioteca', { semCache: true }).then((daConta) => {
      setDados((local) => Object.fromEntries(Object.keys(inicial).map((c) => [c, { ...local[c], ...daConta[c] }])));
      sincronizado.current = true;
    }).catch(() => {});
  }, [usuario?.id]);

  // Depois de sincronizado, cada mudança vai para a conta (com atraso para agrupar)
  useEffect(() => {
    if (!usuario || !sincronizado.current) return;
    const t = setTimeout(() => enviar('/biblioteca', dados, 'PUT').catch(() => {}), 800);
    return () => clearTimeout(t);
  }, [dados, usuario]);

  const alternar = useCallback((campo, anime) => setDados((d) => {
    const copia = { ...d[campo] };
    if (copia[anime.slug]) delete copia[anime.slug];
    else copia[anime.slug] = { slug: anime.slug, titulo: anime.titulo, em: Date.now() };
    return { ...d, [campo]: copia };
  }), []);

  // Guarda onde o usuário parou: usado em "Continuar assistindo"
  const salvarProgresso = useCallback((anime, numero, segundos, duracao) => setDados((d) => ({
    ...d,
    progresso: { ...d.progresso, [anime.slug]: { slug: anime.slug, titulo: anime.titulo, numero, segundos, duracao, em: Date.now() } },
  })), []);

  const marcarAssistido = useCallback((slug, numero) => setDados((d) => {
    const lista = new Set(d.assistidos[slug] ?? []);
    lista.add(numero);
    return { ...d, assistidos: { ...d.assistidos, [slug]: [...lista] } };
  }), []);

  const valor = useMemo(() => ({
    ...dados,
    naLista: (slug) => Boolean(dados.lista[slug]),
    favorito: (slug) => Boolean(dados.favoritos[slug]),
    assistido: (slug, n) => (dados.assistidos[slug] ?? []).includes(n),
    alternarLista: (a) => alternar('lista', a),
    alternarFavorito: (a) => alternar('favoritos', a),
    salvarProgresso, marcarAssistido,
  }), [dados, alternar, salvarProgresso, marcarAssistido]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export const useBiblioteca = () => useContext(Contexto);
