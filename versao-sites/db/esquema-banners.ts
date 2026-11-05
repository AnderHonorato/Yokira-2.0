import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const bannersConfiguracao = sqliteTable('banners_configuracao', {
 id: integer('id').primaryKey(), intervaloPadraoSegundos: integer('intervalo_padrao_segundos').notNull().default(8),
 atualizadoEm: integer('atualizado_em').notNull().default(0),
}, t => [check('banners_configuracao_unica', sql`${t.id}=1`),
 check('banners_configuracao_intervalo', sql`${t.intervaloPadraoSegundos} BETWEEN 3 AND 60`),
 check('banners_configuracao_atualizacao', sql`${t.atualizadoEm}>=0`),
]);
export const banners = sqliteTable('banners', {
 id: text('id').primaryKey(), tituloId: text('titulo_id').notNull(), imagem: text('imagem').notNull(),
 personagem: text('personagem').notNull().default(''), link: text('link').notNull().default(''),
 intervaloSegundos: integer('intervalo_segundos'), ordem: integer('ordem').notNull().default(0),
 ativo: integer('ativo', { mode: 'boolean' }).notNull().default(sql`1`),
 arquivado: integer('arquivado', { mode: 'boolean' }).notNull().default(sql`0`), atualizadoEm: integer('atualizado_em').notNull().default(0),
}, t => [index('banners_publicos').on(t.arquivado, t.ativo, t.ordem),
 check('banners_intervalo', sql`${t.intervaloSegundos} IS NULL OR ${t.intervaloSegundos} BETWEEN 3 AND 60`),
 check('banners_ordem', sql`${t.ordem} BETWEEN 0 AND 999`), check('banners_ativo', sql`${t.ativo} IN(0,1)`),
 check('banners_arquivado', sql`${t.arquivado} IN(0,1)`), check('banners_atualizacao', sql`${t.atualizadoEm}>=0`),
]);
