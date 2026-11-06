'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** Mantém cada envio separado: concluir uma imagem não libera os demais. */
export function useEnviosMidia(onOcupado?: (ocupado: boolean) => void) {
 const ativos = useRef(new Set<string>()), callback = useRef(onOcupado), vivo = useRef(true);
 const [ocupado, setOcupado] = useState(false);
 useEffect(() => { callback.current = onOcupado; }, [onOcupado]);
 useEffect(() => {
  vivo.current = true; const pendentes = ativos.current;
  return () => { vivo.current = false; if (pendentes.size) { pendentes.clear(); callback.current?.(false); } };
 }, []);
 const ocupar = useCallback((id: string, estado: boolean) => {
  if (!vivo.current) return;
  const anterior = ativos.current.size > 0;
  if (estado) ativos.current.add(id); else ativos.current.delete(id);
  const atual = ativos.current.size > 0;
  if (atual !== anterior) { setOcupado(atual); callback.current?.(atual); }
 }, []);
 const temEnvios = useCallback(() => ativos.current.size > 0, []);
 return { ocupado, ocupar, temEnvios };
}
