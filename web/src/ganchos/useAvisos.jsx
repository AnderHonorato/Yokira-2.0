import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import './Avisos.css';

// Pequenas notificações no canto da tela ("Adicionado à lista", "+10 XP"...)
const Contexto = createContext(() => {});
const ICONES = { ok: CheckCircle2, erro: AlertCircle, xp: Sparkles };

export function ProvedorAvisos({ children }) {
  const [avisos, setAvisos] = useState([]);
  const avisar = useCallback((texto, tipo = 'ok') => {
    const id = Date.now() + Math.random();
    setAvisos((l) => [...l.slice(-3), { id, texto, tipo }]);
    setTimeout(() => setAvisos((l) => l.filter((a) => a.id !== id)), 3200);
  }, []);
  return (
    <Contexto.Provider value={avisar}>
      {children}
      <div className="avisos" role="status" aria-live="polite">
        {avisos.map(({ id, texto, tipo }) => { const Icone = ICONES[tipo]; return <div key={id} className={`aviso aviso-${tipo}`}><Icone size={17} />{texto}</div>; })}
      </div>
    </Contexto.Provider>
  );
}
export const useAvisos = () => useContext(Contexto);
