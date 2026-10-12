import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './LinhaRolavel.css';

// Faixa horizontal com rolagem por setas (desktop) e toque (mobile)
export default function LinhaRolavel({ children, largura = 168, rotulo }) {
  const trilho = useRef(null);
  const mover = (direcao) => trilho.current?.scrollBy({ left: direcao * trilho.current.clientWidth * 0.85, behavior: 'smooth' });
  return (
    <div className="linha">
      <button className="linha-seta linha-seta-esq" onClick={() => mover(-1)} aria-label={`Voltar ${rotulo ?? ''}`}><ChevronLeft size={20} /></button>
      <div className="linha-trilho" ref={trilho} style={{ '--largura-item': `${largura}px` }}>{children}</div>
      <button className="linha-seta linha-seta-dir" onClick={() => mover(1)} aria-label={`Avançar ${rotulo ?? ''}`}><ChevronRight size={20} /></button>
    </div>
  );
}
