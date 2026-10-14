// Arquivo: testes/unitarios/dupla-confirmacao.teste.ts
// O passo 2 e a barreira principal na interface: se ele liberar cedo, o resto nao importa.

import { describe, expect, it } from 'vitest';
import { podeConfirmar, rotuloDoPasso } from '../../src/lib/componentes/comum/dialogo-confirmacao';

describe('podeConfirmar com palavra-chave', () => {
  const exigencia = { palavraChave: 'EXCLUIR' };

  it('bloqueia enquanto a palavra nao bate', () => {
    expect(podeConfirmar(exigencia, '', false)).toBe(false);
    expect(podeConfirmar(exigencia, 'EXCLUI', false)).toBe(false);
    expect(podeConfirmar(exigencia, 'apagar', false)).toBe(false);
  });

  it('aceita a palavra certa em qualquer caixa, com espaco sobrando', () => {
    expect(podeConfirmar(exigencia, 'EXCLUIR', false)).toBe(true);
    expect(podeConfirmar(exigencia, ' excluir ', false)).toBe(true);
  });

  it('marcar a caixa nao substitui a palavra', () => {
    expect(podeConfirmar(exigencia, '', true)).toBe(false);
  });
});

describe('podeConfirmar com caixa de marcar', () => {
  const exigencia = { rotuloDaCaixa: 'Entendi' };

  it('so libera com a caixa marcada', () => {
    expect(podeConfirmar(exigencia, '', false)).toBe(false);
    expect(podeConfirmar(exigencia, 'qualquer coisa', false)).toBe(false);
    expect(podeConfirmar(exigencia, '', true)).toBe(true);
  });
});

describe('rotuloDoPasso', () => {
  it('mostra o passo atual', () => {
    expect(rotuloDoPasso(1)).toBe('Passo 1 de 2');
    expect(rotuloDoPasso(2)).toBe('Passo 2 de 2');
  });
});
