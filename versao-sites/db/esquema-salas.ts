import { sql } from 'drizzle-orm';
import { check, index, integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { episodios, usuarios } from './esquema-base';
export const salas = sqliteTable('salas', {
 id: text('id').primaryKey(), donoId: text('dono_id').notNull().references(() => usuarios.id),
 tituloId: text('titulo_id').notNull(), episodioId: text('episodio_id').notNull().references(() => episodios.id),
 modo: text('modo', { enum: ['dupla', 'grupo'] }).notNull(), convite: text('convite').notNull().unique(),
 trancada: integer('trancada', { mode: 'boolean' }).notNull().default(sql`0`),
 encerrada: integer('encerrada', { mode: 'boolean' }).notNull().default(sql`0`),
 pausado: integer('pausado', { mode: 'boolean' }).notNull().default(sql`1`),
 posicao: real('posicao').notNull().default(0), revisao: integer('revisao').notNull().default(0),
 atualizadoEm: integer('atualizado_em').notNull(), criadoEm: integer('criado_em').notNull(),
}, t => [index('salas_dono').on(t.donoId, t.encerrada),
 check('salas_modo', sql`${t.modo} IN ('dupla','grupo')`), check('salas_convite', sql`length(${t.convite})=64`),
 check('salas_trancada', sql`${t.trancada} IN (0,1)`),
 check('salas_encerrada', sql`${t.encerrada} IN (0,1)`), check('salas_pausado', sql`${t.pausado} IN (0,1)`),
 check('salas_posicao', sql`${t.posicao} BETWEEN 0 AND 36000`), check('salas_revisao', sql`${t.revisao}>=0`),
]);
export const salaMembros = sqliteTable('sala_membros', {
 salaId: text('sala_id').notNull().references(() => salas.id, { onDelete: 'cascade' }),
 usuarioId: text('usuario_id').notNull().references(() => usuarios.id),
 ativo: integer('ativo', { mode: 'boolean' }).notNull().default(sql`1`),
 expulso: integer('expulso', { mode: 'boolean' }).notNull().default(sql`0`), entrouEm: integer('entrou_em').notNull(),
}, t => [primaryKey({ columns: [t.salaId, t.usuarioId] }), index('sala_membros_usuario').on(t.usuarioId, t.ativo, t.salaId),
 check('sala_membros_ativo', sql`${t.ativo} IN (0,1)`), check('sala_membros_expulso', sql`${t.expulso} IN (0,1)`),
]);
export const salaMensagens = sqliteTable('sala_mensagens', {
 id: text('id').primaryKey(), salaId: text('sala_id').notNull().references(() => salas.id, { onDelete: 'cascade' }),
 autorId: text('autor_id').notNull().references(() => usuarios.id), corpo: text('corpo').notNull(),
 oculto: integer('oculto', { mode: 'boolean' }).notNull().default(sql`0`), criadoEm: integer('criado_em').notNull(),
}, t => [index('sala_mensagens_recentes').on(t.salaId, t.criadoEm, t.id),
 check('sala_mensagens_corpo', sql`length(${t.corpo}) BETWEEN 1 AND 1000`),
 check('sala_mensagens_oculto', sql`${t.oculto} IN (0,1)`),
]);
