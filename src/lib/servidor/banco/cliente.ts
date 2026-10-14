// Arquivo: src/lib/servidor/banco/cliente.ts
// Instancia unica do Prisma. Em dev o Vite recarrega o modulo varias vezes, entao guardo
// no globalThis pra nao estourar o limite de conexoes com dezenas de clientes vivos.

import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from './gerado/client.js';

const guardado = globalThis as unknown as { prisma?: PrismaClient };

function criar(): PrismaClient {
  const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? 'file:./dev.db' });
  return new PrismaClient({ adapter });
}

export const banco: PrismaClient = guardado.prisma ?? criar();

if (process.env.NODE_ENV !== 'production') {
  guardado.prisma = banco;
}
