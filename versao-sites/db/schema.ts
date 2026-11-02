import { integer, primaryKey, sqliteTable, text, index, foreignKey } from 'drizzle-orm/sqlite-core';
export const usuarios = sqliteTable('usuarios', {
    id: text('id').primaryKey(), nome: text('nome').notNull(), papel: text('papel').notNull().default('membro'),
    xp: integer('xp').notNull().default(0), criadoEm: integer('criado_em').notNull(),
});
export const publicacoes = sqliteTable('publicacoes', {
    id: text('id').primaryKey(), autorId: text('autor_id').notNull().references(() => usuarios.id),
    tipo: text('tipo').notNull(), titulo: text('titulo').notNull(), corpo: text('corpo').notNull(), criadoEm: integer('criado_em').notNull(),
}, t => [index('publicacoes_criado').on(t.criadoEm)]);
export const respostas = sqliteTable('respostas', {
    id: text('id').primaryKey(), publicacaoId: text('publicacao_id').notNull().references(() => publicacoes.id),
    autorId: text('autor_id').notNull().references(() => usuarios.id), corpo: text('corpo').notNull(), criadoEm: integer('criado_em').notNull(),
}, t => [index('respostas_publicacao').on(t.publicacaoId)]);
export const opcoes = sqliteTable('opcoes', {
    publicacaoId: text('publicacao_id').notNull().references(() => publicacoes.id), tituloId: text('titulo_id').notNull(),
}, t => [primaryKey({ columns: [t.publicacaoId, t.tituloId] })]);
export const votos = sqliteTable('votos', {
    publicacaoId: text('publicacao_id').notNull().references(() => publicacoes.id), usuarioId: text('usuario_id').notNull().references(() => usuarios.id), tituloId: text('titulo_id').notNull(),
}, t => [primaryKey({ columns: [t.publicacaoId, t.usuarioId] }), foreignKey({ columns: [t.publicacaoId, t.tituloId], foreignColumns: [opcoes.publicacaoId, opcoes.tituloId] })]);
export const lista = sqliteTable('lista', {
    usuarioId: text('usuario_id').notNull().references(() => usuarios.id), tituloId: text('titulo_id').notNull(), criadoEm: integer('criado_em').notNull(),
}, t => [primaryKey({ columns: [t.usuarioId, t.tituloId] })]);
export const progresso = sqliteTable('progresso', {
    usuarioId: text('usuario_id').notNull().references(() => usuarios.id), tituloId: text('titulo_id').notNull(), segundos: integer('segundos').notNull(), atualizadoEm: integer('atualizado_em').notNull(),
}, t => [primaryKey({ columns: [t.usuarioId, t.tituloId] })]);
export const jogos = sqliteTable('jogos', {
    id: text('id').primaryKey(), usuarioId: text('usuario_id').notNull().references(() => usuarios.id), modo: text('modo').notNull(), dados: text('dados').notNull(), criadoEm: integer('criado_em').notNull(), atualizadoEm: integer('atualizado_em').notNull(),
}, t => [index('jogos_usuario').on(t.usuarioId, t.criadoEm)]);
export const limites = sqliteTable('limites', {
    usuarioId: text('usuario_id').notNull(), janela: text('janela').notNull(), quantidade: integer('quantidade').notNull(),
}, t => [primaryKey({ columns: [t.usuarioId, t.janela] })]);
