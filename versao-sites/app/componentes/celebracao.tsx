'use client';

import { useState, type CSSProperties } from 'react';
import { ArrowRight, ArrowUpRight, Pause, Play, X } from 'lucide-react';
import type { Notificacao } from '@/lib/notificacoes';
import { obterConquista } from '@/lib/conquistas';
import { EmblemaConquista } from './emblema-conquista';
import { EmblemaNivel, perfilNivel } from './emblema-nivel';
import './celebracao.css';
import './celebracao-evolucao.css';

type Props = { evento: Notificacao; fechar: () => void; continuar: () => void; origem: () => void; idTitulo?:string };

export default function Celebracao({ evento, fechar, continuar, origem, idTitulo='notificacoes-celebracao-titulo' }: Props) {
 const [pausa, setPausa] = useState(false);
 const numero = evento.tipo === 'nivel' ? Number(/^Nível (\d+) alcançado$/.exec(evento.titulo)?.[1]) : 0;
 const nivel = Number.isSafeInteger(numero) && numero > 0 ? numero : null;
 const perfil = perfilNivel(nivel || 1);
 const conquista = obterConquista(evento.badgeId || 'boas-vindas');
 const tier = nivel ? perfil.tier : ({ comum: 0, rara: 2, epica: 4, lendaria: 7 }[conquista?.raridade || 'comum']);
 const estilo = { '--energia': nivel ? perfil.cor : conquista?.cor || '#bd8cff', '--energia-secundaria': nivel ? perfil.apoio : '#ead3a0', '--festa-intensidade': nivel ? perfil.intensidade : .16 + tier * .1 } as CSSProperties;
 return <div className="celebracao" data-pausa={pausa} data-tier={tier} data-tipo={evento.tipo} data-raridade={conquista?.raridade} style={estilo}>
  {tier > 0 && <div className="celebracao-aurora" aria-hidden="true"/>}
  <header className="celebracao-controles">
   <span>YOKIRA <b>/</b> SUA JORNADA</span>
   <button onClick={fechar} aria-label="Fechar celebração"><X size={18}/></button>
  </header>
  <div className="celebracao-selo"><span/>{evento.tipo === 'nivel' ? 'NOVO NÍVEL' : 'CONQUISTA DESBLOQUEADA'}<span/></div>
  <div className="celebracao-palco" aria-hidden="true">
   {tier >= 2 && <><div className="celebracao-impacto"/><div className="celebracao-onda onda-um"/>{tier >= 4 && <div className="celebracao-onda onda-dois"/>}</>}
   {tier >= 4 && <><div className="celebracao-corte corte-um"/><div className="celebracao-corte corte-dois"/></>}
   {tier >= 1 && <div className="celebracao-orbita orbita-externa"/>}
   {tier >= 3 && <div className="celebracao-orbita orbita-interna"/>}
   {tier >= 3 && <div className="celebracao-runas">{Array.from({ length: Math.min(16, tier * 2) }, (_, i) => <i key={i} style={{ '--i': i } as CSSProperties}/>)}</div>}
   {tier >= 1 && <div className="celebracao-fagulhas">{Array.from({ length: nivel ? perfil.particulas : 14 }, (_, i) => <i key={i} style={{ '--i': i } as CSSProperties}/>)}</div>}
   <div className="celebracao-emblema">{nivel ? <EmblemaNivel nivel={nivel} tamanho={tier ? 218 : 172} animado={!pausa}/> : <EmblemaConquista badgeId={evento.badgeId || 'boas-vindas'} tamanho={190} animado={!pausa}/>}</div>
   {tier >= 1 && <div className="celebracao-plataforma"/>}
  </div>
  {nivel && <div className="celebracao-nivel" aria-label={nivel > 1 ? `Nível ${nivel - 1} para nível ${nivel}` : 'Nível 1'}>
   {nivel > 1 && <><span aria-hidden="true">NÍVEL <b>{String(nivel - 1).padStart(2, '0')}</b></span><ArrowRight size={17} aria-hidden="true"/></>}
   <div className="celebracao-contador" aria-hidden="true"><span>{String(Math.max(1, nivel - 1)).padStart(2, '0')}</span><strong>{String(nivel).padStart(2, '0')}</strong></div>
   <span className="celebracao-evolucao" aria-hidden="true">{perfil.nome}</span>
  </div>}
  <div className="celebracao-conteudo">
   <h2 id={idTitulo}>{evento.titulo}</h2>
   <p>{evento.descricao}</p>
   <button className="button button-primary celebracao-continuar" autoFocus onClick={continuar}>Continuar <ArrowUpRight size={17}/></button>
   <button className="celebracao-origem" onClick={origem}>Ver de onde veio <ArrowUpRight size={13}/></button>
  </div>
  <footer className="celebracao-rodape"><small>Registrado na sua história.</small><button onClick={() => setPausa(!pausa)} aria-pressed={pausa}>{pausa ? <Play size={12}/> : <Pause size={12}/>}<span>{pausa ? 'Retomar efeitos' : 'Pausar efeitos'}</span></button></footer>
 </div>;
}
