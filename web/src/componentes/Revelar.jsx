import { useEffect, useRef, useState } from 'react';

// Faz o bloco surgir suavemente quando entra na tela (uma vez só)
export default function Revelar({ children, como: Tag = 'div', className = '', ...resto }) {
  const ref = useRef(null);
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) { setVisivel(true); return; }
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisivel(true); obs.disconnect(); } }, { rootMargin: '0px 0px -8% 0px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return <Tag ref={ref} className={`revelar ${visivel ? 'visivel' : ''} ${className}`} {...resto}>{children}</Tag>;
}
