// Arquivo: testes/integracao/preparar-banco.ts
// Cada arquivo de integracao usa um SQLite proprio em arquivo temporario. Banco de verdade,
// nao mock: o que queremos provar aqui e que a persistencia funciona.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../../src/lib/servidor/banco/gerado/client.js';

// Chamamos o CLI do Prisma pelo proprio node, nao por `npx`. No Windows o `npx` e um
// .cmd: o execFileSync devolve ENOENT sem a extensao e EINVAL com ela, porque o Node
// passou a recusar spawn direto de .cmd. Apontar pro build/index.js funciona nas tres
// plataformas e ainda pula uma camada de processo.
const CLI_DO_PRISMA = createRequire(import.meta.url).resolve('prisma/build/index.js');

/** Roda um comando do Prisma contra o banco indicado. */
export function rodarPrisma(argumentos: string[], url: string): void {
  execFileSync(process.execPath, [CLI_DO_PRISMA, ...argumentos], {
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'pipe'
  });
}

export interface BancoDeTeste {
  banco: PrismaClient;
  encerrar: () => Promise<void>;
}

export function criarBancoDeTeste(): BancoDeTeste {
  const pasta = mkdtempSync(join(tmpdir(), 'yokira-teste-'));
  const url = `file:${join(pasta, 'teste.db')}`;

  rodarPrisma(['migrate', 'deploy'], url);

  const banco = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

  return {
    banco,
    async encerrar() {
      await banco.$disconnect();
      rmSync(pasta, { recursive: true, force: true });
    }
  };
}
