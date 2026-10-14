# Migrar de SQLite para PostgreSQL

O código da aplicação **não muda**. O que muda é o adaptador do Prisma e a URL.

## 1. Trocar o provider

Em `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
}
```

(No Prisma 7 a `url` não fica mais no schema — ela vive no `prisma.config.ts`.)

## 2. Trocar o adaptador

```bash
npm remove @prisma/adapter-better-sqlite3
npm install @prisma/adapter-pg pg
```

Em `prisma.config.ts` e em `src/lib/servidor/banco/cliente.ts`, troque
`PrismaBetterSqlite3` por `PrismaPg`:

```ts
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
```

Os mesmos dois arquivos aparecem também em `prisma/seed.ts` e nos scripts de
`scripts/` — o adaptador está sempre em uma linha só, no topo.

## 3. Ajustar o `.env`

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/yokira?schema=public"
```

## 4. Recriar as migrations

O SQL gerado para SQLite não roda no PostgreSQL. Apague `prisma/migrations/` e
gere de novo contra o banco novo:

```bash
rm -rf prisma/migrations
npx prisma migrate dev --name inicial-postgres
```

## 5. Levar os dados

```bash
# ainda apontando para o SQLite
npx tsx scripts/exportar-banco.ts > backup.json

# depois de trocar a DATABASE_URL para o PostgreSQL
npx tsx scripts/importar-banco.ts backup.json
```

O despejo **não leva senhas de propósito**. Usuários migrados precisam refazer a
senha pelo fluxo de recuperação (ou pelo seed, no caso das contas de demonstração).

## Diferenças que valem atenção

| Assunto              | SQLite                     | PostgreSQL                         |
| -------------------- | -------------------------- | ---------------------------------- |
| Escrita simultânea   | Uma por vez, o banco trava | Concorrência real                  |
| `contains` do Prisma | Sensível a maiúsculas      | Aceita `mode: 'insensitive'`       |
| Busca por texto      | Só `LIKE`                  | `tsvector` / `pg_trgm` disponíveis |
| Backup               | Copiar o arquivo `.db`     | `pg_dump`                          |

A busca em `src/routes/buscar/+page.server.ts` filtra em memória hoje. Ao migrar,
troque por uma consulta com `mode: 'insensitive'` — está marcado no
`RESUMO-DA-ENTREGA.md`.

## Em produção

- Ative SSL na string de conexão (`?sslmode=require`).
- Use `npx prisma migrate deploy` (nunca `migrate dev`) no deploy.
- Faça o pool no PostgreSQL (PgBouncer) se o app rodar em várias instâncias.
