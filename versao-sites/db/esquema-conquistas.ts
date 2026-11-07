import { sql } from 'drizzle-orm';
import { check, foreignKey, integer, primaryKey, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';
import { usuarios } from './esquema-base';
export const conquistasUsuario = sqliteTable('conquistas_usuario', {
 usuarioId: text('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
 badgeId: text('badge_id').notNull(), obtidaEm: integer('obtida_em').notNull(),
}, t => [primaryKey({ columns: [t.usuarioId, t.badgeId] })]);
export const conquistasDestaques = sqliteTable('conquistas_destaques', {
 usuarioId: text('usuario_id').notNull(), badgeId: text('badge_id').notNull(), posicao: integer('posicao').notNull(),
}, t => [primaryKey({ columns: [t.usuarioId, t.badgeId] }), unique().on(t.usuarioId, t.posicao),
 foreignKey({ columns: [t.usuarioId, t.badgeId], foreignColumns: [conquistasUsuario.usuarioId, conquistasUsuario.badgeId] }).onDelete('cascade'),
 check('conquistas_destaques_posicao', sql`${t.posicao} BETWEEN 0 AND 2`),
]);
