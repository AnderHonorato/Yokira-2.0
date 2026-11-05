import { sql } from 'drizzle-orm';
import { integer, primaryKey, sqliteTable, text, index, foreignKey, check, uniqueIndex, unique } from 'drizzle-orm/sqlite-core';
import { situacoesColecao } from '../lib/colecao';
export const usuarios = sqliteTable('usuarios', {
    id: text('id').primaryKey(), nome: text('nome').notNull(), papel: text('papel', { enum: ['membro', 'editor', 'moderador', 'administrador'] }).notNull().default('membro'),
    suspenso: integer('suspenso', { mode: 'boolean' }).notNull().default(false),
    xp: integer('xp').notNull().default(0), criadoEm: integer('criado_em').notNull(),
});
export const publicacoes = sqliteTable('publicacoes', {
    id: text('id').primaryKey(), autorId: text('autor_id').notNull().references(() => usuarios.id),
    oculto: integer('oculto', { mode: 'boolean' }).notNull().default(false),
    tipo: text('tipo').notNull(), titulo: text('titulo').notNull(), corpo: text('corpo').notNull(), criadoEm: integer('criado_em').notNull(),
}, t => [index('publicacoes_criado').on(t.criadoEm)]);
export const respostas = sqliteTable('respostas', {
    id: text('id').primaryKey(), publicacaoId: text('publicacao_id').notNull().references(() => publicacoes.id),
    oculto: integer('oculto', { mode: 'boolean' }).notNull().default(false),
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
    situacao: text('situacao', { enum: situacoesColecao }).notNull().default('planejado'),
    episodiosVistos: integer('episodios_vistos').notNull().default(0), nota: integer('nota'),
    atualizadoEm: integer('atualizado_em').notNull().default(0),
}, t => [primaryKey({ columns: [t.usuarioId, t.tituloId] }),
    check('lista_situacao_valida', sql`${t.situacao} in ('planejado','assistindo','concluido','pausado','abandonado')`),
    check('lista_episodios_validos', sql`${t.episodiosVistos} >= 0 and ${t.episodiosVistos} <= 100000`),
    check('lista_nota_valida', sql`${t.nota} is null or (${t.nota} >= 1 and ${t.nota} <= 10)`),
]);
export const progresso = sqliteTable('progresso', {
    usuarioId: text('usuario_id').notNull().references(() => usuarios.id), tituloId: text('titulo_id').notNull(), segundos: integer('segundos').notNull(), atualizadoEm: integer('atualizado_em').notNull(),
}, t => [primaryKey({ columns: [t.usuarioId, t.tituloId] })]);
export const jogos = sqliteTable('jogos', {
    id: text('id').primaryKey(), usuarioId: text('usuario_id').notNull().references(() => usuarios.id), modo: text('modo').notNull(), dados: text('dados').notNull(), criadoEm: integer('criado_em').notNull(), atualizadoEm: integer('atualizado_em').notNull(),
}, t => [index('jogos_usuario').on(t.usuarioId, t.criadoEm)]);
export const limites = sqliteTable('limites', {
    usuarioId: text('usuario_id').notNull(), janela: text('janela').notNull(), quantidade: integer('quantidade').notNull(),
}, t => [primaryKey({ columns: [t.usuarioId, t.janela] })]);

export const denuncias = sqliteTable('denuncias', {
    id: text('id').primaryKey(), autorId: text('autor_id').notNull().references(() => usuarios.id),
    alvoTipo: text('alvo_tipo', { enum: ['publicacao', 'resposta'] }).notNull(), alvoId: text('alvo_id').notNull(),
    motivo: text('motivo').notNull(), resolvida: integer('resolvida', { mode: 'boolean' }).notNull().default(false),
    criadoEm: integer('criado_em').notNull(),
}, t => [uniqueIndex('denuncia_por_pessoa_alvo').on(t.autorId, t.alvoTipo, t.alvoId), index('denuncias_pendentes').on(t.resolvida, t.criadoEm)]);
export const registros = sqliteTable('registros_moderacao', {
    id: text('id').primaryKey(), autorId: text('autor_id').notNull().references(() => usuarios.id),
    acao: text('acao').notNull(), alvoTipo: text('alvo_tipo').notNull(), alvoId: text('alvo_id').notNull(),
    motivo: text('motivo').notNull(), criadoEm: integer('criado_em').notNull(),
}, t => [index('registros_criado').on(t.criadoEm)]);
export const disponibilidadeCatalogo = sqliteTable('catalogo_disponibilidade', {
    tituloId: text('titulo_id').primaryKey(), oculto: integer('oculto', { mode: 'boolean' }).notNull().default(false),
});

// Espelha as tabelas usadas pelas consultas SQL do acervo administrativo.
export const sobreposicoesConteudo = sqliteTable('sobreposicoes_conteudo', {
    tipo: text('tipo', { enum: ['titulo', 'editorial'] }).notNull(), alvoId: text('alvo_id').notNull(),
    dados: text('dados').notNull(), oculto: integer('oculto', { mode: 'boolean' }).notNull().default(false),
}, t => [primaryKey({ columns: [t.tipo, t.alvoId] }),
    check('sobreposicoes_tipo_valido', sql`${t.tipo} IN ('titulo','editorial')`),
    check('sobreposicoes_dados_validos', sql`json_valid(${t.dados}) AND json_type(${t.dados})='object'`),
    check('sobreposicoes_oculto_valido', sql`${t.oculto} IN (0,1)`),
    uniqueIndex('sobreposicoes_slug_unico').on(sql`json_extract(${t.dados},'$.slug')`).where(sql`${t.tipo}='titulo'`),
]);
export const temporadas = sqliteTable('temporadas', {
    id: text('id').primaryKey(), tituloId: text('titulo_id').notNull(), numero: integer('numero').notNull(),
    nome: text('nome').notNull(), ordem: integer('ordem').notNull(),
    arquivado: integer('arquivado', { mode: 'boolean' }).notNull().default(sql`0`),
    criadoEm: integer('criado_em').notNull(), atualizadoEm: integer('atualizado_em').notNull(),
}, t => [unique().on(t.tituloId, t.numero), unique().on(t.id, t.tituloId),
    check('temporadas_numero_valido', sql`${t.numero} BETWEEN 1 AND 10000`),
    check('temporadas_ordem_valida', sql`${t.ordem} BETWEEN 1 AND 100000`),
    check('temporadas_arquivado_valido', sql`${t.arquivado} IN (0,1)`),
]);
export const episodios = sqliteTable('episodios', {
    id: text('id').primaryKey(), temporadaId: text('temporada_id'), tituloId: text('titulo_id').notNull(),
    numero: integer('numero').notNull(), titulo: text('titulo').notNull(), sinopse: text('sinopse').notNull().default(''),
    duracao: integer('duracao').notNull(), videoUrl: text('video_url').notNull().default(''), poster: text('poster').notNull().default(''),
    publicado: integer('publicado', { mode: 'boolean' }).notNull().default(sql`0`), estreiaEm: integer('estreia_em'),
    arquivado: integer('arquivado', { mode: 'boolean' }).notNull().default(sql`0`),
    criadoEm: integer('criado_em').notNull(), atualizadoEm: integer('atualizado_em').notNull(),
}, t => [foreignKey({ columns: [t.temporadaId, t.tituloId], foreignColumns: [temporadas.id, temporadas.tituloId] }),
    uniqueIndex('episodios_numero_unico').on(t.tituloId, sql`coalesce(${t.temporadaId},'')`, t.numero),
    index('episodios_disponibilidade').on(t.tituloId, t.publicado, t.arquivado, t.estreiaEm),
    check('episodios_numero_valido', sql`${t.numero} BETWEEN 1 AND 100000`),
    check('episodios_duracao_valida', sql`${t.duracao} BETWEEN 1 AND 600`),
    check('episodios_publicado_valido', sql`${t.publicado} IN (0,1)`),
    check('episodios_arquivado_valido', sql`${t.arquivado} IN (0,1)`),
    check('episodios_video_publicado', sql`${t.publicado}=0 OR length(${t.videoUrl})>0`),
]);
export const notificacoes = sqliteTable('notificacoes', {
    id: text('id').primaryKey(), usuarioId: text('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
    evento: text('evento').notNull(), tipo: text('tipo', { enum: ['conquista', 'nivel'] }).notNull(),
    titulo: text('titulo').notNull(), descricao: text('descricao').notNull(), destino: text('destino').notNull(),
    criadoEm: integer('criado_em').notNull(), lidaEm: integer('lida_em'), celebradaEm: integer('celebrada_em'),
}, t => [uniqueIndex('notificacoes_evento_usuario').on(t.usuarioId, t.evento),
    index('notificacoes_usuario_criado').on(t.usuarioId, t.criadoEm),
    check('notificacoes_tipo_valido', sql`${t.tipo} IN ('conquista','nivel')`),
    check('notificacoes_destino_valido', sql`substr(${t.destino},1,4)='/?p=' AND length(${t.destino})<=400 AND instr(${t.destino},':')=0 AND instr(${t.destino},char(92))=0`),
]);

export const episodioFontes = sqliteTable('episodio_fontes', {
    id: text('id').primaryKey(), episodioId: text('episodio_id').notNull().references(() => episodios.id),
    nome: text('nome').notNull(), tipo: text('tipo', { enum: ['direto', 'drive', 'incorporado'] }).notNull(),
    url: text('url').notNull(), ordem: integer('ordem').notNull().default(1),
    ativo: integer('ativo', { mode: 'boolean' }).notNull().default(sql`1`),
}, t => [index('episodio_fontes_ordem').on(t.episodioId, t.ordem, t.id),
    check('episodio_fontes_tipo_valido', sql`${t.tipo} IN ('direto','drive','incorporado')`),
    check('episodio_fontes_ordem_valida', sql`${t.ordem} BETWEEN 1 AND 1000`),
    check('episodio_fontes_ativo_valido', sql`${t.ativo} IN (0,1)`),
]);

export const midia = sqliteTable('midia', {
    id: text('id').primaryKey(), donoId: text('dono_id').notNull().references(() => usuarios.id),
    chave: text('chave').notNull().unique(), nome: text('nome').notNull(),
    tipo: text('tipo', { enum: ['video', 'imagem'] }).notNull(),
    mime: text('mime', { enum: ['video/mp4', 'video/webm', 'image/png', 'image/jpeg', 'image/webp', 'image/avif'] }).notNull(),
    tamanho: integer('tamanho').notNull(), status: text('status', { enum: ['enviando', 'pronto', 'falhou'] }).notNull(),
    criadoEm: integer('criado_em').notNull(), atualizadoEm: integer('atualizado_em').notNull(),
}, t => [index('midia_dono_status').on(t.donoId, t.status),
    check('midia_tipo_valido', sql`${t.tipo} IN ('video','imagem')`),
    check('midia_mime_valido', sql`${t.mime} IN ('video/mp4','video/webm','image/png','image/jpeg','image/webp','image/avif')`),
    check('midia_tamanho_valido', sql`${t.tamanho} BETWEEN 1 AND 104857600`),
    check('midia_status_valido', sql`${t.status} IN ('enviando','pronto','falhou')`),
]);

export const aparenciaGlobal = sqliteTable('aparencia_global', {
    id: integer('id').primaryKey(), cenario: integer('cenario').notNull().default(0),
    intensidade: text('intensidade', { enum: ['suave', 'equilibrado', 'intenso'] }).notNull().default('intenso'),
    atualizadoEm: integer('atualizado_em').notNull().default(0),
}, t => [check('aparencia_global_unica', sql`${t.id}=1`),
    check('aparencia_cenario_valido', sql`${t.cenario} BETWEEN 0 AND 9`),
    check('aparencia_intensidade_valida', sql`${t.intensidade} IN ('suave','equilibrado','intenso')`),
    check('aparencia_atualizacao_valida', sql`${t.atualizadoEm}>=0`),
]);
