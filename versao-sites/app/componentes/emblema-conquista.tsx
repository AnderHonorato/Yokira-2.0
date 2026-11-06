'use client';
import { useId, type CSSProperties } from 'react';
import { BookOpen, BookMarked, Crown, Eye, Flag, Flame, Gem, HeartHandshake, House, Library, ListChecks,
 MessageCircle, MessagesSquare, Orbit, PenLine, ShieldCheck, Sparkles, Sprout, Swords, Trophy } from 'lucide-react';
import { nomesRaridades, obterConquista } from '@/lib/conquistas';
import './emblema-conquista.css';
import {useMovimentoVisivel} from './movimento-visivel';
const icones = { 'boas-vindas': Sprout, 'primeira-publicacao': PenLine, 'primeiro-jogo': Swords,
 'primeira-colecao': BookMarked, colecionador: Eye, 'biblioteca-viva': Library, 'tres-finais': Flag,
 'vinte-finais': BookOpen, 'cem-finais': Crown, critico: Gem, cronista: MessageCircle,
 conversador: MessagesSquare, 'voz-ativa': ListChecks, 'dez-desafios': ShieldCheck,
 'explorador-jogos': Orbit, 'cinco-vitorias': Flame, 'primeiro-vinculo': HeartHandshake,
 anfitriao: House, companhia: Sparkles, 'presenca-lendaria': Trophy };
const formas = {
 semente: 'M50 5C80 16 93 38 90 61C88 82 69 95 50 95C31 95 12 82 10 61C7 38 20 16 50 5Z',
 escudo: 'M50 5L89 20V53C89 73 71 88 50 97C29 88 11 73 11 53V20Z',
 losango: 'M50 3L94 50L50 97L6 50Z',
 hexagono: 'M26 7H74L98 50L74 93H26L2 50Z',
 estrela: 'M50 2L63 27L91 21L84 49L98 72L69 76L50 98L31 76L2 72L16 49L9 21L37 27Z',
 coroa: 'M8 24L31 42L50 7L69 42L92 24L84 81L50 97L16 81Z',
};
export function EmblemaConquista({ badgeId, tamanho = 76, animado = false, rotulo = true }: {
 badgeId: string; tamanho?: number; animado?: boolean; rotulo?: boolean;
}) {
 const id = useId().replace(/:/g, ''), conquista = obterConquista(badgeId),{referencia:referenciaMovimento,ativo:movimentoAtivo}=useMovimentoVisivel<HTMLSpanElement>(animado&&!!conquista);
 if (!conquista) return null;
 const Icone = icones[badgeId as keyof typeof icones] || Gem;
 return <span ref={referenciaMovimento} className="emblema-conquista" data-raridade={conquista.raridade} data-animado={movimentoAtivo}
  style={{ '--emblema-cor': conquista.cor, '--emblema-tamanho': `${tamanho}px` } as CSSProperties}
  role={rotulo ? 'img' : undefined} aria-label={rotulo ? `${conquista.titulo}, ${nomesRaridades[conquista.raridade]}` : undefined}
  aria-hidden={!rotulo || undefined}>
  <span className="emblema-conquista-aura"/><svg viewBox="0 0 100 100" aria-hidden="true">
   <defs><linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stopColor="#fff"/><stop offset=".3" stopColor={conquista.cor}/><stop offset=".72" stopColor={conquista.cor} stopOpacity=".5"/><stop offset="1" stopColor="#fff"/>
   </linearGradient></defs>
   <path d={formas[conquista.forma]} fill="#111522" stroke={`url(#${id}-metal)`} strokeWidth="3"/>
   <path d={formas[conquista.forma]} fill={conquista.cor} fillOpacity=".13" transform="translate(9 9) scale(.82)" stroke={conquista.cor} strokeWidth=".9"/>
   <path d="M27 72L38 77M62 77L73 72" fill="none" stroke={conquista.cor} strokeWidth="2"/>
  </svg><Icone className="emblema-conquista-icone" size={tamanho * .35} strokeWidth={1.6}/>
  <span className="emblema-conquista-luz"/>
 </span>;
}
export default EmblemaConquista;
