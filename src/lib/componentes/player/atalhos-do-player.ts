// Arquivo: src/lib/componentes/player/atalhos-do-player.ts
// Teclas do player. Mapa puro pra dar pra testar sem teclado nem <video>: e aqui que
// mora a regra de nao roubar a tecla de quem esta digitando num campo.

export type AcaoDoPlayer =
  'alternar' | 'avancar' | 'voltar' | 'mudo' | 'tela-cheia' | 'volume-mais' | 'volume-menos';

/** Salto do seek pelas setas. 10s e o passo que o YouTube usa e que o dedo espera. */
export const SALTO_SEGUNDOS = 10;

/** Passo do volume pelas setas verticais. */
export const PASSO_DE_VOLUME = 0.1;

const POR_TECLA: Record<string, AcaoDoPlayer> = {
  ' ': 'alternar',
  k: 'alternar',
  arrowright: 'avancar',
  l: 'avancar',
  arrowleft: 'voltar',
  j: 'voltar',
  m: 'mudo',
  f: 'tela-cheia',
  arrowup: 'volume-mais',
  arrowdown: 'volume-menos'
};

/**
 * Acao da tecla, ou `null` quando ela nao e do player. Digitar num campo nunca vira
 * atalho: sem isso, um espaco numa caixa de busca pausaria o video.
 */
export function acaoDaTecla(tecla: string, alvo: EventTarget | null): AcaoDoPlayer | null {
  if (editavel(alvo)) return null;
  return POR_TECLA[tecla.length === 1 ? tecla.toLowerCase() : tecla.toLowerCase()] ?? null;
}

const CAMPOS = ['INPUT', 'TEXTAREA', 'SELECT'];

/**
 * Reconhece campo de texto pela forma, nao por `instanceof HTMLElement`: aquele
 * global nao existe no servidor nem no vitest, e falha tambem quando o elemento vem
 * de outro realm (iframe), porque cada realm tem a sua propria HTMLElement.
 */
function editavel(alvo: EventTarget | null): boolean {
  if (!alvo || typeof alvo !== 'object') return false;
  const elemento = alvo as { tagName?: unknown; isContentEditable?: unknown };
  if (elemento.isContentEditable === true) return true;
  return typeof elemento.tagName === 'string' && CAMPOS.includes(elemento.tagName);
}

/** Volume depois de um passo, preso entre 0 e 1. */
export function volumeApos(atual: number, direcao: 1 | -1): number {
  const bruto = atual + direcao * PASSO_DE_VOLUME;
  return Math.min(1, Math.max(0, Math.round(bruto * 100) / 100));
}

/** Segundo depois de um salto, preso entre 0 e a duracao. */
export function segundoApos(atual: number, direcao: 1 | -1, duracao: number): number {
  const bruto = atual + direcao * SALTO_SEGUNDOS;
  if (!Number.isFinite(duracao) || duracao <= 0) return Math.max(0, bruto);
  return Math.min(duracao, Math.max(0, bruto));
}

/** O que o atalho precisa saber mexer. Interface pequena de proposito: assim o mapa
 *  tecla -> efeito da pra testar sem <video>, que e onde o erro costuma morar. */
export interface ComandosDoPlayer {
  alternar: () => void;
  buscar: (segundos: number) => void;
  alternarMudo: () => void;
  alternarTelaCheia: () => void;
  definirVolume: (valor: number) => void;
  tempoAtual: () => number;
  duracao: () => number;
  volumeAtual: () => number;
}

export function aplicarAtalho(acao: AcaoDoPlayer, comandos: ComandosDoPlayer): void {
  if (acao === 'alternar') return comandos.alternar();
  if (acao === 'mudo') return comandos.alternarMudo();
  if (acao === 'tela-cheia') return comandos.alternarTelaCheia();

  if (acao === 'avancar' || acao === 'voltar') {
    const direcao = acao === 'avancar' ? 1 : -1;
    return comandos.buscar(segundoApos(comandos.tempoAtual(), direcao, comandos.duracao()));
  }

  const direcao = acao === 'volume-mais' ? 1 : -1;
  comandos.definirVolume(volumeApos(comandos.volumeAtual(), direcao));
}
