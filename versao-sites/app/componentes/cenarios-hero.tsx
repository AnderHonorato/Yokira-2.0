'use client';

import { useEffect, useId, useState } from 'react';

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

export const NOMES_CENARIOS = [
  'Sakura ao luar', 'Metrópole sob chuva', 'Ilhas celestes',
  'Expresso do crepúsculo', 'Templo de neve', 'Areias do destino',
  'Floresta dos espíritos', 'Observatório astral', 'Palácio submerso',
  'Dragões do amanhecer'
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

const artesCarregadas = new Map<string, Promise<string>>();

function carregarArte(endereco: string): Promise<string> {
  const existente = artesCarregadas.get(endereco);
  if (existente) return existente;
  const carga = fetch(endereco).then(async resposta => {
    if (!resposta.ok) throw new Error('Não foi possível carregar o cenário.');
    const arte = await resposta.text();
    if (!arte.includes('<svg')) throw new Error('Cenário inválido.');
    return arte;
  }).catch(erro => {
    artesCarregadas.delete(endereco);
    throw erro;
  });
  artesCarregadas.set(endereco, carga);
  return carga;
}

function ArteCenario({ endereco }: { endereco: string }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [arte, setArte] = useState('');

  useEffect(() => {
    let ativo = true;
    carregarArte(endereco).then(conteudo => {
      if (!ativo) return;
      // Apenas os dez SVGs autorais versionados são carregados. IDs únicos
      // preservam os gradientes quando duas cenas coexistem na transição.
      setArte(conteudo
        .replace(/id="([^"]+)"/g, `id="${id}-$1"`)
        .replace(/url\(#([^)]+)\)/g, `url(#${id}-$1)`)
        .replace('<svg ', '<svg preserveAspectRatio="xMidYMid slice" '));
    }).catch(() => {
      // O fundo da página permanece legível se a arte estiver indisponível.
    });
    return () => { ativo = false; };
  }, [endereco, id]);

  return <div className="cenario-ilustracao" data-cenario-src={endereco} dangerouslySetInnerHTML={{ __html: arte }} />;
}

type CenaVisivel = { atual: number; anterior: number | null };

export default function CenariosHero() {
  const seletorId = useId();
  const [escolha, setEscolha] = useState('automatico');
  const [pausado, setPausado] = useState(false);

  // O primeiro SSR é estável; a sincronização real acontece após hidratar.
  const [cena, setCena] = useState<CenaVisivel>({ atual: 0, anterior: null });

  useEffect(() => {
    const sincronizar = () => {
      const atual = escolha === 'automatico'
        ? indiceCenarioNoInstante(Date.now())
        : Number(escolha);
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
  }, [escolha]);

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
    void carregarArte(proximo).catch(() => {});
  }, [cena.atual]);

  return (
    <>
      <div className={`intro-cenarios${pausado ? ' cenario-pausado' : ''}`} aria-hidden="true" data-cenario-atual={cena.atual}>
        {cena.anterior !== null && (
          <div className="cenario-camada cenario-anterior" key={`anterior-${cena.anterior}`}>
            <ArteCenario endereco={CENARIOS_HERO[cena.anterior]} />
          </div>
        )}
        <div className="cenario-camada cenario-atual" key={cena.atual}>
          <ArteCenario endereco={CENARIOS_HERO[cena.atual]} />
        </div>
        <div className="cenario-nevoa" />
        <div className="cenario-luz" />
      </div>
      <div className="cenarios-controles">
        <label htmlFor={seletorId}>Cenário animado</label>
        <select
          id={seletorId}
          value={escolha}
          onChange={evento => setEscolha(evento.target.value)}
        >
          <option value="automatico">Automático · muda a cada hora</option>
          {NOMES_CENARIOS.map((nome, indice) => (
            <option key={nome} value={indice}>{nome}</option>
          ))}
        </select>
        <button type="button" aria-pressed={pausado} onClick={() => setPausado(valor => !valor)}>
          {pausado ? 'Retomar animação' : 'Pausar animação'}
        </button>
        <span className="cenario-status" role="status" aria-live="polite" aria-atomic="true">
          {NOMES_CENARIOS[cena.atual]}
        </span>
      </div>
    </>
  );
}
