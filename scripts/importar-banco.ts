// Arquivo: scripts/importar-banco.ts
// Le o JSON do exportar-banco e recria os registros no banco atual (SQLite ou PostgreSQL).
// Nao traz senha nenhuma de proposito: usuario migrado refaz a senha por recuperacao.
// Uso: npx tsx scripts/importar-banco.ts backup.json

import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../src/lib/servidor/banco/gerado/client.js';

const caminho = process.argv[2];
if (!caminho) {
  console.error('Informe o arquivo: npx tsx scripts/importar-banco.ts backup.json');
  process.exit(1);
}

const banco = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? 'file:./dev.db' })
});

const despejo = JSON.parse(await readFile(caminho, 'utf8'));

await banco.genero.createMany({ data: despejo.generos });
await banco.titulo.createMany({ data: despejo.titulos });
await banco.tituloGenero.createMany({ data: despejo.tituloGeneros });
await banco.temporada.createMany({ data: despejo.temporadas });
await banco.episodio.createMany({ data: despejo.episodios });

console.log('Importacao concluida. Usuarios nao vieram junto — recrie pelo seed ou cadastro.');
await banco.$disconnect();
