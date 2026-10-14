// Arquivo: src/lib/cliente/carga-instantanea.ts
// Le do IndexedDB primeiro e revalida atras. E o que faz a navegacao pintar antes
// do round-trip: o `load` devolve o cache na hora e a resposta fresca chega depois.
//
// A comparacao existe pra nao trocar o objeto quando o servidor devolveu o mesmo
// conteudo — trocar por igual reinicia o hero rotativo e pisca a grade a toa.

import { gravar, ler } from './cache-sessao';

export interface CargaComCache<T> {
  /** Valor pra pintar agora: cache quando existe, resposta do servidor quando nao. */
  valor: T;
  /** Verdadeiro quando `valor` veio do IndexedDB e nao do servidor. */
  daCache: boolean;
  /**
   * Resolve com a versao fresca quando ela difere da que ja esta na tela,
   * e com `null` quando nao ha nada pra trocar (igual, sem cache ou falhou).
   * Nunca rejeita: revalidacao que falha nao pode derrubar a pagina.
   */
  atualizacao: Promise<T | null>;
}

export interface OpcoesDeCarga<T> {
  chave: string;
  validadeMs: number;
  buscar: () => Promise<T>;
  /** Chaves de topo voláteis (ex.: `geradoEm`) ignoradas na comparacao. */
  ignorar?: string[];
  /** Injetaveis pra teste — em producao usam o IndexedDB de verdade. */
  lerCache?: <V>(chave: string, validadeMs: number) => Promise<V | null>;
  gravarCache?: <V>(chave: string, valor: V) => Promise<void>;
}

function semChaves(valor: unknown, ignorar: string[]): unknown {
  if (ignorar.length === 0) return valor;
  if (valor === null || typeof valor !== 'object' || Array.isArray(valor)) return valor;
  const copia: Record<string, unknown> = { ...(valor as Record<string, unknown>) };
  for (const chave of ignorar) delete copia[chave];
  return copia;
}

/** Compara dois valores ignorando as chaves de topo indicadas. */
export function mesmoConteudo(a: unknown, b: unknown, ignorar: string[] = []): boolean {
  return JSON.stringify(semChaves(a, ignorar)) === JSON.stringify(semChaves(b, ignorar));
}

export async function carregarComCache<T>(opcoes: OpcoesDeCarga<T>): Promise<CargaComCache<T>> {
  const lerDaqui = opcoes.lerCache ?? ler;
  const gravarAqui = opcoes.gravarCache ?? gravar;
  const ignorar = opcoes.ignorar ?? [];

  let emCache: T | null;
  try {
    emCache = await lerDaqui<T>(opcoes.chave, opcoes.validadeMs);
  } catch {
    // IndexedDB bloqueado (aba anonima, cota, permissao): seguimos direto pro servidor.
    emCache = null;
  }

  if (emCache === null) {
    const fresco = await opcoes.buscar();
    // Gravar nao pode travar a pintura, entao nao esperamos o await aqui.
    void gravarAqui(opcoes.chave, fresco).catch(() => {});
    return { valor: fresco, daCache: false, atualizacao: Promise.resolve(null) };
  }

  const naTela = emCache;
  const atualizacao = opcoes
    .buscar()
    .then(async (fresco) => {
      await gravarAqui(opcoes.chave, fresco).catch(() => {});
      return mesmoConteudo(naTela, fresco, ignorar) ? null : fresco;
    })
    .catch(() => null);

  return { valor: naTela, daCache: true, atualizacao };
}
