import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { usuarios } from './esquema-base';
export const notificacoesSociais = sqliteTable('notificacoes_sociais', {
 id: text('id').primaryKey().notNull(),
 usuarioId: text('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
 autorId: text('autor_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
 ciclo: text('ciclo').notNull(), tipo: text('tipo', { enum: ['pedido-amizade', 'amizade-aceita'] }).notNull(),
 criadoEm: integer('criado_em').notNull(), lidaEm: integer('lida_em'),
}, t => [uniqueIndex('notificacoes_sociais_evento').on(t.usuarioId, t.ciclo, t.tipo),
 index('notificacoes_sociais_usuario_criado').on(t.usuarioId, t.criadoEm),
 check('notificacao_social_tipo', sql`${t.tipo} IN ('pedido-amizade','amizade-aceita')`),
 check('notificacao_social_sem_auto', sql`${t.usuarioId}<>${t.autorId}`),
]);
