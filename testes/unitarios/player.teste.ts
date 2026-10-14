// Arquivo: testes/unitarios/player.teste.ts
// Os modulos puros do player. O que quebra silencioso aqui e numero invalido: duracao
// NaN antes dos metadados, video ao vivo com duracao infinita, divisao por zero na
// barra. Tudo isso vira "0:00" ou 0, nunca "NaN" na tela.

import { describe, expect, it, vi } from 'vitest';
import {
  formatarTempo,
  fracaoAssistida,
  segundoNaPosicao
} from '../../src/lib/componentes/player/formatar-tempo';
import {
  acaoDaTecla,
  aplicarAtalho,
  segundoApos,
  volumeApos,
  type ComandosDoPlayer
} from '../../src/lib/componentes/player/atalhos-do-player';
import { criarOcultador } from '../../src/lib/componentes/player/ocultar-controles';
import { criarPulso } from '../../src/lib/componentes/player/pulso-de-audiencia';

describe('formatarTempo', () => {
  it('usa hora so quando passa de uma', () => {
    expect(formatarTempo(0)).toBe('0:00');
    expect(formatarTempo(65)).toBe('1:05');
    expect(formatarTempo(3599)).toBe('59:59');
    expect(formatarTempo(3723)).toBe('1:02:03');
  });

  it('numero invalido nunca vira NaN na tela', () => {
    expect(formatarTempo(Number.NaN)).toBe('0:00');
    expect(formatarTempo(Number.POSITIVE_INFINITY)).toBe('0:00');
    expect(formatarTempo(-5)).toBe('0:00');
  });
});

describe('fracaoAssistida', () => {
  it('nao divide por zero nem passa de 1', () => {
    expect(fracaoAssistida(30, 120)).toBe(0.25);
    expect(fracaoAssistida(10, 0)).toBe(0);
    expect(fracaoAssistida(10, Number.NaN)).toBe(0);
    expect(fracaoAssistida(500, 120)).toBe(1);
  });
});

describe('segundoNaPosicao', () => {
  it('prende a posicao dentro do video', () => {
    expect(segundoNaPosicao(0.5, 120)).toBe(60);
    expect(segundoNaPosicao(1.4, 120)).toBe(120);
    expect(segundoNaPosicao(-0.2, 120)).toBe(0);
    expect(segundoNaPosicao(0.5, 0)).toBe(0);
  });
});

describe('acaoDaTecla', () => {
  it('reconhece as teclas do player', () => {
    expect(acaoDaTecla(' ', null)).toBe('alternar');
    expect(acaoDaTecla('K', null)).toBe('alternar');
    expect(acaoDaTecla('ArrowRight', null)).toBe('avancar');
    expect(acaoDaTecla('f', null)).toBe('tela-cheia');
    expect(acaoDaTecla('x', null)).toBeNull();
  });

  it('nao rouba a tecla de quem esta digitando', () => {
    // Sem isso, um espaco numa caixa de busca pausaria o video.
    for (const marca of ['INPUT', 'TEXTAREA', 'SELECT']) {
      const campo = { tagName: marca, isContentEditable: false } as unknown as EventTarget;
      expect(acaoDaTecla(' ', campo)).toBeNull();
    }
    const caixaDeTexto = { isContentEditable: true } as unknown as EventTarget;
    expect(acaoDaTecla(' ', caixaDeTexto)).toBeNull();
    // Um botao nao e campo de texto: ali o atalho continua valendo.
    expect(acaoDaTecla(' ', { tagName: 'BUTTON' } as unknown as EventTarget)).toBe('alternar');
  });
});

describe('volumeApos e segundoApos', () => {
  it('prendem nos limites', () => {
    expect(volumeApos(0.5, 1)).toBe(0.6);
    expect(volumeApos(0.95, 1)).toBe(1);
    expect(volumeApos(0.05, -1)).toBe(0);
    expect(segundoApos(100, 1, 120)).toBe(110);
    expect(segundoApos(115, 1, 120)).toBe(120);
    expect(segundoApos(3, -1, 120)).toBe(0);
  });
});

describe('aplicarAtalho', () => {
  function comandosFalsos(): ComandosDoPlayer & { chamadas: string[] } {
    const chamadas: string[] = [];
    return {
      chamadas,
      alternar: () => chamadas.push('alternar'),
      buscar: (s) => chamadas.push(`buscar:${s}`),
      alternarMudo: () => chamadas.push('mudo'),
      alternarTelaCheia: () => chamadas.push('tela-cheia'),
      definirVolume: (v) => chamadas.push(`volume:${v}`),
      tempoAtual: () => 50,
      duracao: () => 120,
      volumeAtual: () => 0.5
    };
  }

  it('liga cada acao ao comando certo', () => {
    const c = comandosFalsos();
    for (const acao of ['alternar', 'mudo', 'tela-cheia'] as const) aplicarAtalho(acao, c);
    aplicarAtalho('avancar', c);
    aplicarAtalho('voltar', c);
    aplicarAtalho('volume-mais', c);

    expect(c.chamadas).toEqual([
      'alternar',
      'mudo',
      'tela-cheia',
      'buscar:60',
      'buscar:40',
      'volume:0.6'
    ]);
  });
});

describe('criarOcultador', () => {
  it('travado nao some; destravado some depois da espera', () => {
    vi.useFakeTimers();
    const vistos: boolean[] = [];
    const ocultador = criarOcultador((visivel) => vistos.push(visivel), 1000);

    ocultador.travar(true);
    ocultador.revelar();
    vi.advanceTimersByTime(5000);
    expect(vistos.at(-1)).toBe(true);

    ocultador.travar(false);
    vi.advanceTimersByTime(999);
    expect(vistos.at(-1)).toBe(true);
    vi.advanceTimersByTime(1);
    expect(vistos.at(-1)).toBe(false);

    ocultador.encerrar();
    vi.useRealTimers();
  });
});

describe('criarPulso', () => {
  it('falha de rede nao zera o contador na tela', async () => {
    vi.useFakeTimers();
    const contagens: number[] = [];
    // A promessa nasce na hora da chamada: criar a rejeitada antes vira rejeicao nao
    // tratada antes de alguem esperar por ela.
    let falhar = false;
    const pulso = criarPulso(
      () => (falhar ? Promise.reject(new Error('rede caiu')) : Promise.resolve(7)),
      (n) => contagens.push(n),
      1000
    );

    pulso.iniciar();
    await vi.advanceTimersByTimeAsync(0);
    expect(contagens).toEqual([7]);

    falhar = true;
    await vi.advanceTimersByTimeAsync(1000);
    expect(contagens).toEqual([7]);

    pulso.encerrar();
    vi.useRealTimers();
  });
});
