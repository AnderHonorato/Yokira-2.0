import { useEffect, useState } from 'react';
import { buscar } from '../util/api.js';

// Busca um caminho da API e devolve { dados, erro, carregando }
export function useApi(caminho) {
  const [estado, setEstado] = useState({ dados: null, erro: null, carregando: true });
  useEffect(() => {
    if (!caminho) return;
    let ativo = true;
    setEstado((e) => ({ ...e, carregando: true, erro: null }));
    buscar(caminho)
      .then((dados) => ativo && setEstado({ dados, erro: null, carregando: false }))
      .catch((erro) => ativo && setEstado({ dados: null, erro: erro.message, carregando: false }));
    return () => { ativo = false; };
  }, [caminho]);
  return estado;
}
