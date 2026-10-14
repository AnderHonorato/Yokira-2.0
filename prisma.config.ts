// Arquivo: prisma.config.ts
// Prisma 7 le a configuracao daqui (nao mais do package.json) e exige um driver adapter.
// Trocar SQLite por PostgreSQL e trocar este adapter — o resto do codigo nao muda.

import 'dotenv/config';
import { defineConfig } from 'prisma/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL ?? 'file:./dev.db'
  },
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts'
  },
  adapter: async () => new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? 'file:./dev.db' })
});
