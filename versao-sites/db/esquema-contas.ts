import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const authTentativas = sqliteTable('auth_tentativas', {
 chave: text('chave').primaryKey(), quantidade: integer('quantidade').notNull(), expiraEm: integer('expira_em').notNull(),
}, t => [index('auth_tentativas_expira_idx').on(t.expiraEm)]);
