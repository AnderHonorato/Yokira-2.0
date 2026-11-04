'use client';

import { useEffect, useState } from 'react';

export const CENARIOS_HERO = [
  '/arte/cenarios/01-sakura-luar.svg',
  '/arte/cenarios/02-metropole-chuva.svg',
  '/arte/cenarios/03-ilhas-celestes.svg',
  '/arte/cenarios/04-expresso-crepusculo.svg',
  '/arte/cenarios/05-templo-de-neve.svg',
  '/arte/cenarios/06-areias-do-destino.svg',
  '/arte/cenarios/07-floresta-espiritos.svg',
  '/arte/cenarios/08-observatorio-astral.svg',
  '/arte/cenarios/09-palacio-submerso.svg',
  '/arte/cenarios/10-dragoes-do-amanhecer.svg'
] as const;

const HORA_MS = 60 * 60 * 1000;
const TRANSICAO_MS = 1800;

/**
 * Determinístico: todo visitante vê um dos dez cenários durante a mesma hora.
 * A sequência avança na virada da hora UTC e retorna ao início após dez horas.
 */
export function indiceCenarioNoInstante(instante: number): number {
  return ((Math.floor(instante / HORA_MS) % CENARIOS_HERO.length) + CENARIOS_HERO.length) % CENARIOS_HERO.length;
}

type CenaVisivel = { atual: number; anterior: number | null };

export default function CenariosHero() {
  // O primeiro SSR é estável; a sincronização real acontece após hidratar.
  const [cena, setCena] = useState<CenaVisivel>({ atual: 0, anterior: null });

  useEffect(() => {
    const sincronizar = () => {
      const atual = indiceCenarioNoInstante(Date.now());
      setCena(anterior =>
        anterior.atual === atual ? anterior : { atual, anterior: anterior.atual }
      );
    };

    sincronizar();
    let temporizador: ReturnType<typeof setTimeout>;
    const agendar = () => {
      const agora = Date.now();
      const atraso = HORA_MS - (agora % HORA_MS) + 60;
      temporizador = setTimeout(() => {
        sincronizar();
        agendar();
      }, atraso);
    };
    const quandoVoltar = () => {
      if (document.visibilityState === 'visible') sincronizar();
    };
    agendar();
    document.addEventListener('visibilitychange', quandoVoltar);
    window.addEventListener('focus', sincronizar);
    return () => {
      clearTimeout(temporizador);
      document.removeEventListener('visibilitychange', quandoVoltar);
      window.removeEventListener('focus', sincronizar);
    };
  }, []);

  useEffect(() => {
    if (cena.anterior === null) return;
    const temporizador = setTimeout(() => {
      setCena(estado => ({ atual: estado.atual, anterior: null }));
    }, TRANSICAO_MS);
    return () => clearTimeout(temporizador);
  }, [cena.atual, cena.anterior]);

  // Carrega somente o próximo cenário em segundo plano, sem baixar as dez imagens de uma vez.
  useEffect(() => {
    const proximo = CENARIOS_HERO[(cena.atual + 1) % CENARIOS_HERO.length];
    const imagem = new Image();
    imagem.src = proximo;
  }, [cena.atual]);

  return (
    <div className="intro-cenarios" aria-hidden="true" data-cenario-atual={cena.atual}>
      {cena.anterior !== null && (
        <div className="cenario-camada cenario-anterior" key={`anterior-${cena.anterior}`}>
          <div
            className="cenario-ilustracao"
            style={{ backgroundImage: `url("${CENARIOS_HERO[cena.anterior]}")` }}
          />
        </div>
      )}
      <div className="cenario-camada cenario-atual" key={cena.atual}>
        <div
          className="cenario-ilustracao"
          style={{ backgroundImage: `url("${CENARIOS_HERO[cena.atual]}")` }}
        />
      </div>
      <div className="cenario-nevoa" />
      <div className="cenario-luz" />
    </div>
  );
}
