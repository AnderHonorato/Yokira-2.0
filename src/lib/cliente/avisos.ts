// Arquivo: src/lib/cliente/avisos.ts
// Fila unica de avisos da interface. Existe porque cada tela vinha inventando o
// proprio "recado": um <p> que aparecia embaixo do botao e ninguem via, com texto
// diferente pra mesma coisa. Agora toda acao termina em um aviso com a mesma cara.

import { writable } from 'svelte/store';

export type TomDoAviso = 'sucesso' | 'erro' | 'neutro';

export interface Aviso {
  id: number;
  texto: string;
  tom: TomDoAviso;
}

/** Erro fica mais tempo: quem errou precisa ler o motivo, quem acertou so confirma. */
const DURACAO_MS: Record<TomDoAviso, number> = {
  sucesso: 2600,
  neutro: 3000,
  erro: 5000
};

export const avisos = writable<Aviso[]>([]);

let proximoId = 0;

export function avisar(texto: string, tom: TomDoAviso = 'neutro'): number {
  const id = (proximoId += 1);
  avisos.update((atuais) => [...atuais, { id, texto, tom }]);

  if (typeof window !== 'undefined') {
    window.setTimeout(() => dispensar(id), DURACAO_MS[tom]);
  }

  return id;
}

export function dispensar(id: number): void {
  avisos.update((atuais) => atuais.filter((aviso) => aviso.id !== id));
}

/** Atalho pro caminho que mais se repete: try/catch em volta de uma acao de rede. */
export function avisarErro(erro: unknown, alternativa = 'Não foi possível concluir.'): void {
  avisar(erro instanceof Error ? erro.message : alternativa, 'erro');
}
