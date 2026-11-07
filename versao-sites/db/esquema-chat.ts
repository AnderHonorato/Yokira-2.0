import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { episodios, usuarios } from './esquema-base';
import { salas } from './esquema-salas';

export const atividadePerfis = sqliteTable('atividade_perfis', {
 usuarioId: text('usuario_id').primaryKey().notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
 tituloId: text('titulo_id').notNull(), episodioId: text('episodio_id').notNull().references(() => episodios.id),
 atualizadoEm: integer('atualizado_em').notNull(),
});
export const chatImagens = sqliteTable('chat_imagens', {
 id: text('id').primaryKey().notNull(), usuarioId: text('usuario_id').notNull().references(() => usuarios.id),
 chave: text('chave').notNull().unique(), mime: text('mime', { enum: ['image/jpeg', 'image/png', 'image/webp'] }).notNull(),
 tamanho: integer('tamanho').notNull(), finalidade: text('finalidade', { enum: ['chat', 'avatar', 'banner'] }).notNull(),
 criadoEm: integer('criado_em').notNull(),
}, t => [index('chat_imagens_usuario_criado').on(t.usuarioId, t.criadoEm),
 check('chat_imagens_mime', sql`${t.mime} IN ('image/jpeg','image/png','image/webp')`),
 check('chat_imagens_tamanho', sql`${t.tamanho} BETWEEN 1 AND 4194304`),
 check('chat_imagens_finalidade', sql`${t.finalidade} IN ('chat','avatar','banner')`),
]);
export const chatMensagens = sqliteTable('chat_mensagens', {
 id: text('id').primaryKey().notNull(), autorId: text('autor_id').notNull().references(() => usuarios.id),
 corpo: text('corpo').notNull().default(''), imagemId: text('imagem_id').references(() => chatImagens.id),
 salaId: text('sala_id').references(() => salas.id), oculto: integer('oculto', { mode: 'boolean' }).notNull().default(sql`0`),
 criadoEm: integer('criado_em').notNull(),
}, t => [index('chat_mensagens_recentes').on(t.criadoEm, t.id), index('chat_mensagens_autor').on(t.autorId, t.criadoEm),
 index('chat_mensagens_imagem').on(t.imagemId, t.oculto), check('chat_mensagens_corpo', sql`length(${t.corpo})<=1000`),
 check('chat_mensagens_oculto', sql`${t.oculto} IN (0,1)`), check('chat_mensagens_anexo_exclusivo', sql`${t.imagemId} IS NULL OR ${t.salaId} IS NULL`),
 check('chat_mensagens_conteudo', sql`length(trim(${t.corpo}))>0 OR ${t.imagemId} IS NOT NULL OR ${t.salaId} IS NOT NULL`),
]);
