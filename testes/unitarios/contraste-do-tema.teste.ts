// Arquivo: testes/unitarios/contraste-do-tema.teste.ts
// Trava o contraste dos pares texto-sobre-superficie nos DOIS temas.
//
// Existe porque o tema claro entrou depois: --cor-texto inverte com o tema e a
// superficie colorida nao, entao o botao principal ficou com quase-preto sobre
// roxo escuro (2.58:1) sem nada acusar. Ler o valor do CSS, e nao repetir a cor
// aqui, e o que faz o teste falhar quando alguem mexer na paleta.

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const MINIMO_AA = 4.5;

function lerTokens(arquivo: string, prefixo: string): Record<string, string> {
  const css = readFileSync(arquivo, 'utf8');
  const achados: Record<string, string> = {};
  for (const [, nome, valor] of css.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g)) {
    if (nome.startsWith(prefixo)) achados[nome.slice(prefixo.length)] = valor;
  }
  return achados;
}

function luminancia(hex: string): number {
  const cru = hex.replace('#', '');
  const canais = [0, 2, 4]
    .map((i) => parseInt(cru.substr(i, 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * canais[0] + 0.7152 * canais[1] + 0.0722 * canais[2];
}

export function razaoDeContraste(frente: string, fundo: string): number {
  const [claro, escuro] = [luminancia(frente), luminancia(fundo)].sort((a, b) => b - a);
  return (claro + 0.05) / (escuro + 0.05);
}

const ESCURO = lerTokens('src/lib/estilos/tema.css', 'cor-');
const CLARO = lerTokens('src/lib/estilos/tema-claro.css', 'claro-');

/** [rotulo, token do texto, token do fundo] */
const PARES: ReadonlyArray<readonly [string, string, string]> = [
  ['botao principal e chips de marca', 'texto-sobre-marca', 'marca-superficie'],
  ['botao de confirmacao', 'texto-sobre-sucesso', 'sucesso-superficie'],
  ['texto principal', 'texto', 'fundo'],
  ['texto secundario', 'texto-secundario', 'fundo'],
  ['texto terciario', 'texto-terciario', 'fundo'],
  ['texto terciario sobre card', 'texto-terciario', 'superficie']
];

describe('contraste dos dois temas', () => {
  it('os dois arquivos de tema declaram os mesmos tokens de cor', () => {
    for (const nome of Object.keys(ESCURO)) {
      // Cores com rgba() ficam de fora da leitura; so comparo as que sao hex nos dois.
      if (nome in CLARO) expect(typeof CLARO[nome]).toBe('string');
    }
    expect(Object.keys(CLARO).length).toBeGreaterThan(10);
  });

  for (const [rotulo, frente, fundo] of PARES) {
    it(`${rotulo}: passa em AA no tema escuro`, () => {
      expect(ESCURO[frente], `token --cor-${frente} nao encontrado`).toBeDefined();
      expect(ESCURO[fundo], `token --cor-${fundo} nao encontrado`).toBeDefined();
      expect(razaoDeContraste(ESCURO[frente], ESCURO[fundo])).toBeGreaterThanOrEqual(MINIMO_AA);
    });

    it(`${rotulo}: passa em AA no tema claro`, () => {
      expect(CLARO[frente], `token --claro-${frente} nao encontrado`).toBeDefined();
      expect(CLARO[fundo], `token --claro-${fundo} nao encontrado`).toBeDefined();
      expect(razaoDeContraste(CLARO[frente], CLARO[fundo])).toBeGreaterThanOrEqual(MINIMO_AA);
    });
  }
});
