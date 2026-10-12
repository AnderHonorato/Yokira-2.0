import { useEffect, useState } from 'react';

// Alterna claro/escuro e lembra a escolha
export function useTema() {
  const [tema, setTema] = useState(() => document.documentElement.dataset.tema || 'escuro');
  useEffect(() => {
    document.documentElement.dataset.tema = tema;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', tema === 'claro' ? '#f6f5fa' : '#08080b');
    try { localStorage.setItem('yokira:tema', tema); } catch { /* armazenamento indisponível */ }
  }, [tema]);
  return [tema, () => setTema((t) => (t === 'claro' ? 'escuro' : 'claro'))];
}
