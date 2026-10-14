// Arquivo: src/lib/validacoes/lista.ts
// Entradas dos endpoints de lista, progresso e avaliacao.

import { exigirInteiro, exigirTexto } from './erro-validacao.js';

export function validarAlternarLista(dados: unknown): { tituloId: string } {
  const corpo = (dados ?? {}) as Record<string, unknown>;
  return { tituloId: exigirTexto(corpo.tituloId, 'tituloId', 40) };
}

export function validarProgresso(dados: unknown): { episodioId: string; segundos: number } {
  const corpo = (dados ?? {}) as Record<string, unknown>;
  return {
    episodioId: exigirTexto(corpo.episodioId, 'episodioId', 40),
    segundos: exigirInteiro(corpo.segundos, 'segundos', 0, 86_400)
  };
}

/** `nota: null` remove a avaliacao — e assim que descurtir funciona sem endpoint novo. */
export function validarAvaliacao(dados: unknown): { tituloId: string; nota: number | null } {
  const corpo = (dados ?? {}) as Record<string, unknown>;
  return {
    tituloId: exigirTexto(corpo.tituloId, 'tituloId', 40),
    nota: corpo.nota === null ? null : exigirInteiro(corpo.nota, 'nota', 1, 10)
  };
}

export function validarSinalDeAudiencia(dados: unknown): { episodioId: string; chave: string } {
  const corpo = (dados ?? {}) as Record<string, unknown>;
  return {
    episodioId: exigirTexto(corpo.episodioId, 'episodioId', 40),
    chave: exigirTexto(corpo.chave, 'chave', 64)
  };
}
