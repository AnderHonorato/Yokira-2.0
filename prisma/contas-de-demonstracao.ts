// Arquivo: prisma/contas-de-demonstracao.ts
// Contas criadas pelo seed. Separado do seed.ts pra manter os dois abaixo das 180 linhas
// e porque "quem entra no sistema" e um assunto diferente de "qual e o catalogo".

import { hash } from '@node-rs/argon2';
import type { PrismaClient } from '../src/lib/servidor/banco/gerado/client.js';

const PARAMETROS_ARGON = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

export async function semearContas(banco: PrismaClient): Promise<void> {
  const contas = [
    {
      email: process.env.ADMIN_EMAIL ?? 'admin@yokira.local',
      senha: process.env.ADMIN_SENHA ?? 'YokiraAdmin#2024',
      nome: 'Administrador Yokira',
      papel: 'ADMINISTRADOR' as const
    },
    {
      email: 'espectador@yokira.local',
      senha: 'YokiraDemo#2024',
      nome: 'Espectador de Demonstra\u00e7\u00e3o',
      papel: 'ESPECTADOR' as const
    }
  ];

  for (const conta of contas) {
    await banco.usuario.upsert({
      where: { email: conta.email },
      create: {
        email: conta.email,
        nome: conta.nome,
        papel: conta.papel,
        emailVerificado: true,
        senhaHash: await hash(conta.senha, PARAMETROS_ARGON),
        perfis: { create: { apelido: conta.nome } }
      },
      update: { papel: conta.papel }
    });
  }
}

/** Contas so para dar volume as avaliacoes do seed. Sem senha utilizavel. */
export async function garantirVotantes(banco: PrismaClient): Promise<string[]> {
  const ids: string[] = [];
  for (let numero = 1; numero <= 5; numero += 1) {
    const usuario = await banco.usuario.upsert({
      where: { email: `votante${numero}@yokira.local` },
      create: {
        email: `votante${numero}@yokira.local`,
        nome: `Votante ${numero}`,
        senhaHash: 'sem-login'
      },
      update: {}
    });
    ids.push(usuario.id);
  }
  return ids;
}
