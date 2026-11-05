'use client';

import Image from 'next/image';
import { useState, type CSSProperties } from 'react';
import { ArrowRight, ArrowUpRight, Pause, Play, X } from 'lucide-react';
import type { Notificacao } from '@/lib/notificacoes';
import './celebracao.css';

type Props = { evento: Notificacao; fechar: () => void; continuar: () => void; origem: () => void; idTitulo?:string };

export default function Celebracao({ evento, fechar, continuar, origem, idTitulo='notificacoes-celebracao-titulo' }: Props) {
 const [pausa, setPausa] = useState(false);
 const numero = evento.tipo === 'nivel' ? Number(/^Nível (\d+) alcançado$/.exec(evento.titulo)?.[1]) : 0;
 const nivel = Number.isSafeInteger(numero) && numero > 1 ? numero : null;
 return <div className="celebracao" data-pausa={pausa}>
  <div className="celebracao-aurora" aria-hidden="true"/>
  <header className="celebracao-controles">
   <span>YOKIRA <b>/</b> SUA JORNADA</span>
   <button onClick={fechar} aria-label="Fechar celebração"><X size={18}/></button>
  </header>
  <div className="celebracao-selo"><span/>{evento.tipo === 'nivel' ? 'ASCENSÃO DE NÍVEL' : 'CONQUISTA DESBLOQUEADA'}<span/></div>
  <div className="celebracao-palco" aria-hidden="true">
   <div className="celebracao-impacto"/>
   <div className="celebracao-onda onda-um"/><div className="celebracao-onda onda-dois"/>
   <div className="celebracao-corte corte-um"/><div className="celebracao-corte corte-dois"/>
   <div className="celebracao-orbita orbita-externa"/>
   <div className="celebracao-orbita orbita-interna"/>
   <div className="celebracao-runas">{Array.from({ length: 12 }, (_, i) => <i key={i} style={{ '--i': i } as CSSProperties}/>)}</div>
   <div className="celebracao-fagulhas">{Array.from({ length: 32 }, (_, i) => <i key={i} style={{ '--i': i } as CSSProperties}/>)}</div>
   <div className="celebracao-cristal"><span className="celebracao-faceta"/><span className="celebracao-faceta faceta-frente"/>
    <div className="celebracao-marca"><Image src="/marca/emblema-192.png" alt="" width={192} height={192} unoptimized priority/><span/></div>
   </div>
   <div className="celebracao-plataforma"/>
  </div>
  {nivel && <div className="celebracao-nivel" aria-label={`Nível ${nivel - 1} para nível ${nivel}`}>
   <span aria-hidden="true">NÍVEL <b>{String(nivel - 1).padStart(2, '0')}</b></span><ArrowRight size={17} aria-hidden="true"/>
   <div className="celebracao-contador" aria-hidden="true"><span>{String(nivel - 1).padStart(2, '0')}</span><strong>{String(nivel).padStart(2, '0')}</strong></div>
   <span className="celebracao-evolucao" aria-hidden="true">PODER EM<br/>EVOLUÇÃO</span>
  </div>}
  <div className="celebracao-conteudo">
   <h2 id={idTitulo}>{evento.titulo}</h2>
   <p>{evento.descricao}</p>
   <button className="button button-primary celebracao-continuar" autoFocus onClick={continuar}>Continuar minha jornada <ArrowUpRight size={17}/></button>
   <button className="celebracao-origem" onClick={origem}>Ver de onde veio <ArrowUpRight size={13}/></button>
  </div>
  <footer className="celebracao-rodape"><small>Registrado na sua história.</small><button onClick={() => setPausa(!pausa)} aria-pressed={pausa}>{pausa ? <Play size={12}/> : <Pause size={12}/>}<span>{pausa ? 'Retomar efeitos' : 'Pausar efeitos'}</span></button></footer>
 </div>;
}
