// Arquivo: scripts/exportar-banco.ts
// Despeja o conteudo em JSON pra migrar de SQLite pra PostgreSQL sem dump binario.
// Uso: npx tsx scripts/exportar-banco.ts > backup.json

import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../src/lib/servidor/banco/gerado/client.js';

const banco = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? 'file:./dev.db' })
});

const despejo = {
  exportadoEm: new Date().toISOString(),
  generos: await banco.genero.findMany(),
  titulos: await banco.titulo.findMany(),
  tituloGeneros: await banco.tituloGenero.findMany(),
  temporadas: await banco.temporada.findMany(),
  episodios: await banco.episodio.findMany(),
  usuarios: await banco.usuario.findMany({
    select: { id: true, email: true, nome: true, papel: true, criadoEm: true }
  })
};

console.log(JSON.stringify(despejo, null, 2));
await banco.$disconnect();
