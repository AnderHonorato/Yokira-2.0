// Conta de demonstração nunca deve chegar à produção com senha conhecida.

import { describe, expect, it } from 'vitest';
import type { PrismaClient } from '../../src/lib/servidor/banco/gerado/client';
import {
  podeSemearContasDemonstrativas,
  semearContas
} from '../../prisma/contas-de-demonstracao';
import { senhaDeDemonstracaoBloqueada } from '../../src/lib/servidor/banco/conta';

describe('segurança de contas demonstrativas', () => {
  it('não semeia contas em produção fora da suíte E2E', () => {
    expect(podeSemearContasDemonstrativas('production', undefined)).toBe(false);
    expect(podeSemearContasDemonstrativas('production', '0')).toBe(false);
    expect(podeSemearContasDemonstrativas('production', '1')).toBe(true);
    expect(podeSemearContasDemonstrativas('development')).toBe(true);
  });

  it('recusa senhas públicas de demonstração em ambiente produtivo', () => {
    expect(senhaDeDemonstracaoBloqueada('YokiraAdmin#2024', 'production', undefined)).toBe(true);
    expect(senhaDeDemonstracaoBloqueada('YokiraDemo#2024', 'production', undefined)).toBe(true);
    expect(senhaDeDemonstracaoBloqueada('senha-particular', 'production', undefined)).toBe(false);
    expect(senhaDeDemonstracaoBloqueada('YokiraAdmin#2024', 'development')).toBe(false);
    expect(senhaDeDemonstracaoBloqueada('YokiraAdmin#2024', 'production', '1')).toBe(false);
  });

  it('nunca altera o papel de uma conta existente ao repetir o seed', async () => {
    const chamadas: Array<{ update: unknown }> = [];
    const simulacao = {
      usuario: {
        upsert: async (dados: { update: unknown }) => {
          chamadas.push(dados);
          return { id: 'teste' };
        }
      }
    };
    await semearContas(simulacao as unknown as PrismaClient);
    expect(chamadas).toHaveLength(2);
    expect(chamadas.every((dados) => JSON.stringify(dados.update) === '{}')).toBe(true);
  });
});
