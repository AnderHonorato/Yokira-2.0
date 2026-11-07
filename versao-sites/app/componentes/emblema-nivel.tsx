'use client';
import { useId, type CSSProperties } from 'react';
import './emblema-nivel.css';
import {MarcaAnimada} from './marca-animada';
import {useMovimentoVisivel} from './movimento-visivel';

type Props = { nivel: number; tamanho?: number; animado?: boolean; rotulo?: string; marca?:boolean };
const faixas = [
 { inicio: 1, nome: 'Iniciante', cor: '#a5a9b8', apoio: '#667084' },
 { inicio: 5, nome: 'Explorador', cor: '#b9b8d0', apoio: '#8c6daf' },
 { inicio: 10, nome: 'Guardião', cor: '#6cbcff', apoio: '#7062df' },
 { inicio: 20, nome: 'Ascendente', cor: '#b883ff', apoio: '#6244df' },
 { inicio: 35, nome: 'Soberano', cor: '#f2cb77', apoio: '#bf792f' },
 { inicio: 50, nome: 'Lendário', cor: '#ff8aa7', apoio: '#a92c7c' },
 { inicio: 75, nome: 'Celestial', cor: '#90f5e5', apoio: '#7b75ff' },
 { inicio: 100, nome: 'Eterno', cor: '#ead1ff', apoio: '#ad67ff' },
];
/** A ornamentação tem teto; o número continua mostrando o nível real. */
export function perfilNivel(valor: number) {
 const nivel = Number.isFinite(valor) ? Math.max(1, Math.floor(valor)) : 1;
 const tier = faixas.findLastIndex(faixa => nivel >= faixa.inicio);
 const faixa = faixas[tier];
 const seguinte = faixas[tier + 1]?.inicio || 125;
 const progresso = Math.min(1, (nivel - faixa.inicio) / (seguinte - faixa.inicio));
 const cor = '#' + [1, 3, 5].map(posicao => Math.round(parseInt(faixa.cor.slice(posicao, posicao + 2), 16) * (1 - progresso * .12) + 255 * progresso * .12).toString(16).padStart(2, '0')).join('');
 return { ...faixa, cor, nivel, tier, progresso, particulas: Math.min(24, tier === 0 ? 1 + Math.floor(progresso * 4) : 2 + tier * 3 + Math.floor(progresso * 3)), intensidade: Math.min(1, .14 + tier * .1 + progresso * .09) };
}
export function EmblemaNivel({ nivel: valor, tamanho = 96, animado = true, rotulo, marca }: Props) {
 const id = useId().replace(/:/g, ''),{referencia:referenciaMovimento,ativo:movimentoAtivo}=useMovimentoVisivel<HTMLSpanElement>(animado),comMarca=marca??tamanho>=76;
 const { nivel, tier, cor, apoio, progresso, intensidade, particulas } = perfilNivel(valor);
 const estilo = { '--nivel-cor': cor, '--nivel-apoio': apoio, '--nivel-intensidade': intensidade, '--nivel-progresso': progresso, width: tamanho, height: tamanho } as CSSProperties;
 return <span ref={referenciaMovimento} className="emblema-nivel" data-tier={tier} data-marca-original={comMarca} data-animado={movimentoAtivo} style={estilo} role="img" aria-label={rotulo || `Nível ${nivel}`}>
  <svg viewBox="0 0 160 160" fill="none" aria-hidden="true" focusable="false">
   <defs>
    <linearGradient id={`${id}-metal`} x1="28" y1="22" x2="131" y2="139" gradientUnits="userSpaceOnUse"><stop stopColor="#f8f6ff"/><stop offset=".26" stopColor={cor}/><stop offset=".5" stopColor={apoio}/><stop offset=".72" stopColor={cor}/><stop offset="1" stopColor="#e4dcef"/></linearGradient>
    <linearGradient id={`${id}-fundo`} x1="80" y1="36" x2="80" y2="133" gradientUnits="userSpaceOnUse"><stop stopColor={apoio}/><stop offset="1" stopColor="#0c0b17"/></linearGradient>
    <clipPath id={`${id}-recorte`}><path d="m80 29 38 18-6 54-32 31-32-31-6-54Z"/></clipPath>
   </defs>
   {tier >= 2 && <g className="nivel-aura"><circle cx="80" cy="80" r={54 + tier * 2} stroke={cor} strokeWidth=".7" strokeDasharray={tier > 4 ? '2 5' : '8 7'}/></g>}
   {tier >= 3 && <g className="nivel-asas" stroke={`url(#${id}-metal)`} strokeWidth="2"><path d="M49 69 23 46l4 29 17 17-28-12 13 25 25 9M111 69l26-23-4 29-17 17 28-12-13 25-25 9"/>{tier >= 5 && <path d="m34 70-22-9 9 35 29 29m76-55 22-9-9 35-29 29"/>}</g>}
   {tier >= 1 && <g stroke={`url(#${id}-metal)`} strokeWidth={tier >= 4 ? 4 : 2}><path d="m40 131 77-88m-3-3 7 7M120 131 43 43m-4 4 7-7"/></g>}
   <path className="nivel-casco" d="m80 24 44 21-7 60-37 35-37-35-7-60Z" fill="#11101b" stroke={`url(#${id}-metal)`} strokeWidth={2 + Math.min(3, tier * .4)}/>
   <path d="m80 31 36 18-5 51-31 30-31-30-5-51Z" fill={`url(#${id}-fundo)`} stroke={cor} strokeOpacity=".6"/>
   <path d="m80 34 1 91-28-28-5-45Z" fill="#ffffff09"/>
   <path d="m55 56 25-12 25 12M56 100l24 23 24-23" stroke={cor} strokeOpacity=".45"/>
   <g clipPath={`url(#${id}-recorte)`}><path className="nivel-reflexo" d="m-20 10 24-10 99 160-24 10Z" fill="#ffffff" fillOpacity=".2"/></g>
   {tier >= 4 && <path className="nivel-coroa" d="m57 35-4-20 17 10L80 9l10 16 17-10-4 20Z" fill={`url(#${id}-metal)`} stroke={cor}/>}
   {tier < 4 && <path d="m80 20 4 7-4 7-4-7Z" fill={cor}/>}
   <text x="80" y={comMarca?130:91} textAnchor="middle" fill="#f8f4ff" fontFamily="var(--mono),monospace" fontWeight="600" fontSize={comMarca?(nivel>99?20:25):(nivel>99?29:38)}>{nivel}</text>
   <path d="m65 106 15 8 15-8" stroke={cor} strokeWidth="2"/>
   <g className="nivel-particulas">{Array.from({ length: particulas }, (_, i) => <circle key={i} cx="80" cy="15" r={i % 3 === 0 ? 1.4 : .8} fill={i % 2 ? cor : '#f6eeff'} style={{ '--i': i, '--total': particulas } as CSSProperties}/>)}</g>
   {tier >= 6 && <g className="nivel-satelites" stroke={cor}><path d="m80 1 3 5-3 5-3-5Zm0 148 3 5-3 5-3-5ZM2 80l5-3 5 3-5 3Zm146 0 5-3 5 3-5 3Z" fill={apoio}/></g>}
  </svg>
  {comMarca&&<span className="nivel-marca" aria-hidden="true"><MarcaAnimada tamanho={Math.round(tamanho*.44)} destaque={tier>=2} animado={movimentoAtivo}/></span>}
 </span>;
}
