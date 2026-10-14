-- Evolucao social, heatmap, idiomas e abstracao de midia. Somente ALTER/CREATE: nenhum dado atual e apagado.
ALTER TABLE "Titulo" ADD COLUMN "idiomaOriginal" TEXT NOT NULL DEFAULT 'ja';
ALTER TABLE "Titulo" ADD COLUMN "pontuacaoEmAlta" REAL NOT NULL DEFAULT 0;
ALTER TABLE "Titulo" ADD COLUMN "rankingAtualizadoEm" DATETIME;
CREATE INDEX "Titulo_situacao_pontuacaoEmAlta_idx" ON "Titulo"("situacao", "pontuacaoEmAlta");

ALTER TABLE "ArquivoMidia" ADD COLUMN "provedor" TEXT NOT NULL DEFAULT 'local';
ALTER TABLE "ArquivoMidia" ADD COLUMN "chaveExterna" TEXT;
ALTER TABLE "ArquivoMidia" ADD COLUMN "origem" TEXT NOT NULL DEFAULT 'ARQUIVO';
CREATE INDEX "ArquivoMidia_provedor_idx" ON "ArquivoMidia"("provedor");

ALTER TABLE "Legenda" ADD COLUMN "padrao" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "FaixaAudio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "episodioId" TEXT NOT NULL,
    "idioma" TEXT NOT NULL,
    "rotulo" TEXT NOT NULL,
    "caminho" TEXT,
    "padrao" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "FaixaAudio_episodioId_fkey" FOREIGN KEY ("episodioId") REFERENCES "Episodio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "FaixaAudio_episodioId_idx" ON "FaixaAudio"("episodioId");

CREATE TABLE "CurtidaTitulo" (
    "usuarioId" TEXT NOT NULL,
    "tituloId" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("usuarioId", "tituloId"),
    CONSTRAINT "CurtidaTitulo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CurtidaTitulo_tituloId_fkey" FOREIGN KEY ("tituloId") REFERENCES "Titulo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "CurtidaTitulo_tituloId_criadoEm_idx" ON "CurtidaTitulo"("tituloId", "criadoEm");

CREATE TABLE "CurtidaEpisodio" (
    "usuarioId" TEXT NOT NULL,
    "episodioId" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("usuarioId", "episodioId"),
    CONSTRAINT "CurtidaEpisodio_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CurtidaEpisodio_episodioId_fkey" FOREIGN KEY ("episodioId") REFERENCES "Episodio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "CurtidaEpisodio_episodioId_criadoEm_idx" ON "CurtidaEpisodio"("episodioId", "criadoEm");

CREATE TABLE "Comentario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "tituloId" TEXT,
    "episodioId" TEXT,
    "corpo" TEXT NOT NULL,
    "situacao" TEXT NOT NULL DEFAULT 'PUBLICADO',
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    "editadoEm" DATETIME,
    CONSTRAINT "Comentario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comentario_tituloId_fkey" FOREIGN KEY ("tituloId") REFERENCES "Titulo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comentario_episodioId_fkey" FOREIGN KEY ("episodioId") REFERENCES "Episodio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Comentario_tituloId_situacao_criadoEm_idx" ON "Comentario"("tituloId", "situacao", "criadoEm");
CREATE INDEX "Comentario_episodioId_situacao_criadoEm_idx" ON "Comentario"("episodioId", "situacao", "criadoEm");
CREATE INDEX "Comentario_usuarioId_criadoEm_idx" ON "Comentario"("usuarioId", "criadoEm");

CREATE TABLE "SessaoConsumo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "episodioId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "chave" TEXT NOT NULL,
    "dia" DATETIME NOT NULL,
    "iniciadaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimaAtividade" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SessaoConsumo_episodioId_fkey" FOREIGN KEY ("episodioId") REFERENCES "Episodio" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SessaoConsumo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "SessaoConsumo_episodioId_chave_dia_key" ON "SessaoConsumo"("episodioId", "chave", "dia");
CREATE INDEX "SessaoConsumo_episodioId_dia_idx" ON "SessaoConsumo"("episodioId", "dia");

CREATE TABLE "ConsumoIntervalo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessaoId" TEXT NOT NULL,
    "inicioSegundos" INTEGER NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConsumoIntervalo_sessaoId_fkey" FOREIGN KEY ("sessaoId") REFERENCES "SessaoConsumo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ConsumoIntervalo_sessaoId_inicioSegundos_key" ON "ConsumoIntervalo"("sessaoId", "inicioSegundos");
CREATE INDEX "ConsumoIntervalo_inicioSegundos_idx" ON "ConsumoIntervalo"("inicioSegundos");
