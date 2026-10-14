// Arquivo: scripts/promover-administrador.ts
// Promove uma conta existente a ADMINISTRADOR. Fora da interface de proposito:
// escalar privilegio por tela e um convite a acidente.
// Uso: npx tsx scripts/promover-administrador.ts email@dominio.com

import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../src/lib/servidor/banco/gerado/client.js';

const email = process.argv[2]?.toLowerCase();
if (!email) {
  console.error('Informe o e-mail: npx tsx scripts/promover-administrador.ts email@dominio.com');
  process.exit(1);
}

const banco = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? 'file:./dev.db' })
});

const usuario = await banco.usuario.findUnique({ where: { email } });
if (!usuario) {
  console.error(`Nenhuma conta com o e-mail ${email}.`);
  process.exit(1);
}

await banco.usuario.update({ where: { email }, data: { papel: 'ADMINISTRADOR' } });
console.log(`${email} agora e ADMINISTRADOR.`);
await banco.$disconnect();
