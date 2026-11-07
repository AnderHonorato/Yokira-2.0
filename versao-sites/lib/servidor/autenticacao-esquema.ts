import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

const data = (nome: string) => integer(nome, { mode: 'timestamp_ms' });
export const user = sqliteTable('auth_usuarios', {
    id: text('id').primaryKey(), name: text('nome').notNull(), email: text('email').notNull().unique(),
    emailVerified: integer('email_verificado', { mode: 'boolean' }).notNull().default(false),
    image: text('imagem'), createdAt: data('criado_em').notNull(), updatedAt: data('atualizado_em').notNull()
}, tabela => [check('auth_usuarios_email_verificado', sql`${tabela.emailVerified} IN (0,1)`)]);
export const session = sqliteTable('auth_sessoes', {
    id: text('id').primaryKey(), token: text('token').notNull().unique(),
    userId: text('usuario_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    expiresAt: data('expira_em').notNull(), createdAt: data('criado_em').notNull(), updatedAt: data('atualizado_em').notNull(),
    ipAddress: text('ip'), userAgent: text('agente')
}, tabela => [index('auth_sessoes_usuario_idx').on(tabela.userId)]);
export const account = sqliteTable('auth_credenciais', {
    id: text('id').primaryKey(), accountId: text('conta_id').notNull(), providerId: text('provedor_id').notNull(),
    userId: text('usuario_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('token_acesso'), refreshToken: text('token_renovacao'), idToken: text('token_identidade'),
    accessTokenExpiresAt: data('acesso_expira_em'), refreshTokenExpiresAt: data('renovacao_expira_em'),
    scope: text('escopo'), password: text('senha_hash'), createdAt: data('criado_em').notNull(), updatedAt: data('atualizado_em').notNull()
}, tabela => [index('auth_credenciais_usuario_idx').on(tabela.userId), unique().on(tabela.providerId, tabela.accountId)]);
export const verification = sqliteTable('auth_verificacoes', {
    id: text('id').primaryKey(), identifier: text('identificador').notNull(), value: text('valor').notNull(),
    expiresAt: data('expira_em').notNull(), createdAt: data('criado_em').notNull(), updatedAt: data('atualizado_em').notNull()
}, tabela => [index('auth_verificacoes_identificador_idx').on(tabela.identifier)]);
export const rateLimit = sqliteTable('auth_limites', {
    id: text('id').primaryKey(), key: text('chave').notNull().unique(), count: integer('quantidade').notNull(),
    lastRequest: integer('ultima_requisicao').notNull()
});
