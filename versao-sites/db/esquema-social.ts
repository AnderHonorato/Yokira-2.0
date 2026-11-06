import { sql } from 'drizzle-orm';
import { check, customType, index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { usuarios } from './esquema-base';
const textoSemCaixa = customType<{ data: string }>({ dataType: () => 'text COLLATE NOCASE' });
export const perfisSociais = sqliteTable('perfis_sociais', {
 usuarioId: text('usuario_id').primaryKey().references(() => usuarios.id, { onDelete: 'cascade' }),
 avatar: text('avatar').notNull().default(''), banner: text('banner').notNull().default(''),
 compartilharAtividade: integer('compartilhar_atividade', { mode: 'boolean' }).notNull().default(sql`0`),
 handle: textoSemCaixa('handle').notNull().unique(), bio: text('bio').notNull().default(''),
 publico: integer('publico', { mode: 'boolean' }).notNull().default(sql`0`),
 mostrarConquistas: integer('mostrar_conquistas', { mode: 'boolean' }).notNull().default(sql`1`),
 atualizadoEm: integer('atualizado_em').notNull(),
}, t => [check('perfil_handle', sql`length(${t.handle}) BETWEEN 3 AND 24 AND ${t.handle}=lower(${t.handle}) AND ${t.handle} NOT GLOB '*[^a-z0-9_]*' AND substr(${t.handle},1,1) GLOB '[a-z0-9]'`),
 check('perfil_compartilhar_atividade', sql`${t.compartilharAtividade} IN (0,1)`),
 check('perfil_bio', sql`length(${t.bio})<=280`),
 check('perfil_visibilidade', sql`${t.publico} IN (0,1) AND ${t.mostrarConquistas} IN (0,1)`),
]);
export const amizades = sqliteTable('amizades', {
 usuarioA: text('usuario_a').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
 usuarioB: text('usuario_b').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
 solicitanteId: text('solicitante_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
 estado: text('estado', { enum: ['pendente', 'aceita'] }).notNull().default('pendente'),
 criadoEm: integer('criado_em').notNull(), atualizadoEm: integer('atualizado_em').notNull(),
}, t => [primaryKey({ columns: [t.usuarioA, t.usuarioB] }),
 check('amizade_par', sql`${t.usuarioA}<${t.usuarioB}`),
 check('amizade_solicitante', sql`${t.solicitanteId} IN (${t.usuarioA},${t.usuarioB})`),
 check('amizade_estado', sql`${t.estado} IN ('pendente','aceita')`),
 index('amizades_destinatario').on(t.usuarioB, t.estado, t.atualizadoEm),
 index('amizades_remetente').on(t.usuarioA, t.estado, t.atualizadoEm),
]);
export const bloqueiosSociais = sqliteTable('bloqueios_sociais', {
 autorId: text('autor_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
 alvoId: text('alvo_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }), criadoEm: integer('criado_em').notNull(),
}, t => [primaryKey({ columns: [t.autorId, t.alvoId] }), check('bloqueio_sem_auto', sql`${t.autorId}<>${t.alvoId}`),
 index('bloqueios_alvo').on(t.alvoId, t.autorId),
]);
