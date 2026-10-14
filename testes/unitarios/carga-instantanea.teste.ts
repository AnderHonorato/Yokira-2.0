// Arquivo: testes/unitarios/carga-instantanea.teste.ts
// Cobre a regra que faz a navegacao pintar antes do round-trip: cache primeiro,
// revalidacao atras, e nenhuma troca de objeto quando o conteudo nao mudou.

import { describe, expect, it } from 'vitest';
import { carregarComCache, mesmoConteudo } from '../../src/lib/cliente/carga-instantanea';

interface Catalogo {
  itens: string[];
  geradoEm: string;
}

function cacheFalso(inicial: Record<string, unknown> = {}) {
  const deposito = new Map<string, unknown>(Object.entries(inicial));
  return {
    deposito,
    lerCache: async <V>(chave: string): Promise<V | null> =>
      (deposito.get(chave) as V | undefined) ?? null,
    gravarCache: async <V>(chave: string, valor: V): Promise<void> => {
      deposito.set(chave, valor);
    }
  };
}

describe('mesmoConteudo', () => {
  it('ignora as chaves volateis indicadas', () => {
    const a = { itens: ['um'], geradoEm: '2026-01-01T00:00:00.000Z' };
    const b = { itens: ['um'], geradoEm: '2026-08-26T12:00:00.000Z' };
    expect(mesmoConteudo(a, b, ['geradoEm'])).toBe(true);
    expect(mesmoConteudo(a, b)).toBe(false);
  });

  it('enxerga diferenca de conteudo de verdade', () => {
    const a = { itens: ['um'], geradoEm: 'x' };
    const b = { itens: ['um', 'dois'], geradoEm: 'x' };
    expect(mesmoConteudo(a, b, ['geradoEm'])).toBe(false);
  });
});

describe('carregarComCache', () => {
  const validadeMs = 60_000;

  it('sem cache, busca no servidor e grava', async () => {
    const cache = cacheFalso();
    const fresco: Catalogo = { itens: ['um'], geradoEm: 'a' };

    const carga = await carregarComCache<Catalogo>({
      chave: 'catalogo',
      validadeMs,
      buscar: async () => fresco,
      ...cache
    });

    expect(carga.daCache).toBe(false);
    expect(carga.valor).toEqual(fresco);
    await expect(carga.atualizacao).resolves.toBeNull();
    expect(cache.deposito.get('catalogo')).toEqual(fresco);
  });

  it('com cache, devolve o cache na hora sem esperar o servidor', async () => {
    const guardado: Catalogo = { itens: ['um'], geradoEm: 'antigo' };
    const cache = cacheFalso({ catalogo: guardado });

    // Servidor que so responde quando a gente mandar: e assim que da pra provar
    // que o `load` resolveu ANTES do round-trip, e nao so depressa.
    let liberarServidor!: (valor: Catalogo) => void;
    const respostaDoServidor = new Promise<Catalogo>((resolver) => {
      liberarServidor = resolver;
    });

    const carga = await carregarComCache<Catalogo>({
      chave: 'catalogo',
      validadeMs,
      buscar: () => respostaDoServidor,
      ignorar: ['geradoEm'],
      ...cache
    });

    // Chegou aqui com o servidor ainda pendurado: o cache pintou primeiro.
    expect(carga.daCache).toBe(true);
    expect(carga.valor).toEqual(guardado);

    liberarServidor({ itens: ['um'], geradoEm: 'novo' });

    // Conteudo igual (so `geradoEm` mudou): nada pra trocar na tela.
    await expect(carga.atualizacao).resolves.toBeNull();
  });

  it('conteudo mudou: a revalidacao entrega a versao fresca', async () => {
    const cache = cacheFalso({ catalogo: { itens: ['um'], geradoEm: 'antigo' } });
    const fresco: Catalogo = { itens: ['um', 'dois'], geradoEm: 'novo' };

    const carga = await carregarComCache<Catalogo>({
      chave: 'catalogo',
      validadeMs,
      buscar: async () => fresco,
      ignorar: ['geradoEm'],
      ...cache
    });

    await expect(carga.atualizacao).resolves.toEqual(fresco);
    expect(cache.deposito.get('catalogo')).toEqual(fresco);
  });

  it('revalidacao que falha nao derruba a pagina', async () => {
    const guardado: Catalogo = { itens: ['um'], geradoEm: 'antigo' };
    const cache = cacheFalso({ catalogo: guardado });

    const carga = await carregarComCache<Catalogo>({
      chave: 'catalogo',
      validadeMs,
      buscar: async () => {
        throw new Error('servidor fora do ar');
      },
      ...cache
    });

    expect(carga.valor).toEqual(guardado);
    await expect(carga.atualizacao).resolves.toBeNull();
  });

  it('IndexedDB bloqueado cai para o servidor em vez de quebrar', async () => {
    const fresco: Catalogo = { itens: ['um'], geradoEm: 'a' };

    const carga = await carregarComCache<Catalogo>({
      chave: 'catalogo',
      validadeMs,
      buscar: async () => fresco,
      lerCache: async () => {
        throw new Error('aba anonima');
      },
      gravarCache: async () => {
        throw new Error('aba anonima');
      }
    });

    expect(carga.daCache).toBe(false);
    expect(carga.valor).toEqual(fresco);
  });
});
