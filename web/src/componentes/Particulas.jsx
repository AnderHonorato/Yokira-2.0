import { useEffect, useRef } from 'react';

// Faíscas subindo devagar sobre o fundo do destaque (canvas, pausa fora da tela e respeita "reduzir movimento")
export default function Particulas({ cor = '196, 181, 253', quantidade = 70 }) {
  const tela = useRef(null);
  useEffect(() => {
    const c = tela.current;
    const ctx = c.getContext('2d');
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let largura, altura, quadro, visivel = true;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const ajustar = () => { largura = c.offsetWidth; altura = c.offsetHeight; c.width = largura * dpr; c.height = altura * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    ajustar();
    const nova = (inicio) => ({ x: Math.random() * largura, y: inicio ? Math.random() * altura : altura + 10, r: Math.random() * 1.8 + 0.4,
      v: Math.random() * 0.45 + 0.15, osc: Math.random() * Math.PI * 2, a: Math.random() * 0.6 + 0.25 });
    const pontos = Array.from({ length: quantidade }, () => nova(true));
    const desenhar = () => {
      ctx.clearRect(0, 0, largura, altura);
      for (const p of pontos) {
        p.y -= p.v; p.osc += 0.012; p.x += Math.sin(p.osc) * 0.3;
        if (p.y < -10) Object.assign(p, nova(false));
        const brilho = p.a * Math.min(1, p.y / (altura * 0.35));
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cor}, ${brilho})`; ctx.shadowBlur = 8; ctx.shadowColor = `rgba(${cor}, ${brilho})`; ctx.fill();
      }
      if (visivel) quadro = requestAnimationFrame(desenhar);
    };
    const obs = new IntersectionObserver(([e]) => { visivel = e.isIntersecting; if (visivel) { cancelAnimationFrame(quadro); desenhar(); } });
    obs.observe(c);
    addEventListener('resize', ajustar);
    return () => { cancelAnimationFrame(quadro); obs.disconnect(); removeEventListener('resize', ajustar); };
  }, [cor, quantidade]);
  return <canvas ref={tela} className="particulas" aria-hidden="true" />;
}
