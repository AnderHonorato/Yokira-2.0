'use client';
import {useState} from 'react';
import {textoMascoteAstra} from './mascote-astra-conteudo';
import './mascote-astra.css';

type Navegar = (pagina: string, valores?: Record<string, string>) => void;

/** Faixa compacta e independente do chat: sem overlay, sem bloquear a navegação móvel. */
export default function MascoteAstra({idioma, navegar}: {idioma: string; navegar: Navegar}) {
 const [aberto, setAberto] = useState(false);
 const texto = textoMascoteAstra(idioma);
 return <aside className={'astra-faixa'+(aberto ? ' astra-aberta' : '')} aria-label={texto.nome}>
  <button type="button" className="astra-avatar-botao" onClick={() => setAberto(valor => !valor)} aria-label={aberto ? texto.fechar : texto.abrir} aria-expanded={aberto} aria-controls="astra-detalhes">
   <span className="astra-avatar-brilho" aria-hidden="true"/>
   <img src="/arte/mascote-astra.webp" width="128" height="128" alt="Astra, mascote roxo com orelhas pontudas, expressão confiante e símbolo de estrela na testa" loading="lazy"/>
   <span className="astra-avatar-selo" aria-hidden="true">✧</span>
  </button>
  <div className="astra-conteudo">
   <span className="astra-eyebrow"><span className="astra-estrela" aria-hidden="true"/> {texto.nome}</span>
   <h2>{texto.titulo}</h2>
   <p>{texto.descricao}</p>
   <div id="astra-detalhes" className="astra-detalhes" hidden={!aberto}>
    <p>{texto.saudacao}</p>
    <div className="astra-acoes">
     <button type="button" onClick={() => navegar('catalogo')}>{texto.acervo}</button>
     <button type="button" onClick={() => navegar('comunidade')}>{texto.comunidade}</button>
    </div>
   </div>
  </div>
  <button type="button" className="astra-alternar" onClick={() => setAberto(valor => !valor)} aria-expanded={aberto} aria-controls="astra-detalhes">{aberto ? texto.fechar : texto.abrir}<span aria-hidden="true">{aberto ? '−' : '+'}</span></button>
 </aside>;
}
