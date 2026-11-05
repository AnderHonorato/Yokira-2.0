import { useId } from 'react';
import './marca-animada.css';

/** Serpente vetorial: o corpo e a cabeça percorrem a mesma espiral entre Y, K e A. */
export function MarcaAnimada({ tamanho = 52 }: { tamanho?: number }) {
 const id = useId().replace(/:/g, '');
 const trajeto = 'M 39 41 C 12 20 18 4 43 8 C 84 14 91 38 62 52 C 29 68 10 50 25 32 C 42 11 88 18 86 43 C 84 67 48 81 28 61 C 9 42 34 30 57 36 C 92 46 89 74 64 79 C 34 86 13 64 23 46 C 27 39 33 38 39 41 Z';
 const cobra = <><path d={trajeto} pathLength="540" className="marca-cobra-borda"/><path d={trajeto} pathLength="540" className="marca-cobra-corpo" stroke={`url(#${id}-escamas)`}/><path d={trajeto} pathLength="540" className="marca-cobra-luz"/><g className="marca-cobra-cabeca"><path d="M-12-4Q-5-7 3-6L12-2 8 4 2 6-10 4Z" fill={`url(#${id}-metal)`} stroke="#3d1768" strokeWidth="1.2"/><path d="m2-4 4 2-4 1" fill="#c77aff"/><path d="m10 1 5 1m-1 0 2-2m-2 2 2 2" fill="none" stroke="#d0a3ff" strokeWidth=".7"/></g></>;
 return <svg className="marca-animada" width={tamanho} height={tamanho} viewBox="0 0 100 100" fill="none" aria-hidden="true" focusable="false">
  <defs>
   <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff"/><stop offset=".3" stopColor="#9b9da9"/><stop offset=".52" stopColor="#282936"/><stop offset=".65" stopColor="#e5e9f4"/><stop offset="1" stopColor="#707181"/></linearGradient>
   <pattern id={`${id}-escamas`} width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="#272331"/><path d="m0 0 2 2 2-2M0 4l2-2 2 2" stroke="#aaa2be" strokeWidth=".65"/></pattern>
   <mask id={`${id}-frente`}><path fill="white" d="M0 0h100v37H0zM33 35h10v19H33zM63 48h12v17H63zM0 67h100v33H0z"/></mask>
  </defs>
  <circle cx="50" cy="46" r="40" stroke="#8237d1" strokeWidth=".8" opacity=".5"/>
  <g className="marca-katana" transform="rotate(-34 50 50)"><path d="M47 5h6v24h-6z" fill="#2d183e" stroke="#ad81df"/><path d="m47 8 6 4m-6 1 6 4m-6 1 6 4m-6 1 6 4" stroke="#c8a9ee"/><path d="M40 30q10-5 20 0l-1 4H41z" fill={`url(#${id}-metal)`} stroke="#6e3a98"/><path d="M47 34h6v48l-3 13-3-13Z" fill={`url(#${id}-metal)`}/><path d="M50 35v50" stroke="#ddd5f5" strokeWidth=".8"/></g>
  <g className="marca-cobra-atras">{cobra}</g>
  <g className="marca-siglas" fill={`url(#${id}-metal)`} stroke="#15111d" strokeWidth="1.2" strokeLinejoin="round">
   <path d="m5 52 12 2 7 12 6-13 12-1-13 24-1 15-12 3 2-18Z"/>
   <path d="m40 51 11-3-2 17 13-18 13-1-19 23 16 17-13 2-12-13-1 15-11 2Z"/>
   <path d="m78 50 10 2 11 40-11-3-2-9-13-1-5 10-12-2Zm2 13-4 9 8 1Z" fillRule="evenodd"/>
  </g>
  <g mask={`url(#${id}-frente)`} className="marca-cobra-frente">{cobra}</g>
 </svg>;
}
