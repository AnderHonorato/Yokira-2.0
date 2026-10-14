-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "papel" TEXT NOT NULL DEFAULT 'ESPECTADOR',
    "emailVerificado" BOOLEAN NOT NULL DEFAULT false,
    "tentativasFalhas" INTEGER NOT NULL DEFAULT 0,
    "bloqueadoAte" DATETIME,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Perfil" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "apelido" TEXT NOT NULL,
    "idiomaLegenda" TEXT NOT NULL DEFAULT 'pt-BR',
    "autoplay" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Perfil_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Sessao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "expiraEm" DATETIME NOT NULL,
    "agenteUsuario" TEXT,
    "criadaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revogadaEm" DATETIME,
    CONSTRAINT "Sessao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TokenVerificacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiraEm" DATETIME NOT NULL,
    CONSTRAINT "TokenVerificacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TokenRecuperacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiraEm" DATETIME NOT NULL,
    "usadoEm" DATETIME,
    CONSTRAINT "TokenRecuperacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TokenConfirmacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "alvo" TEXT,
    "expiraEm" DATETIME NOT NULL,
    "usadoEm" DATETIME,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TokenConfirmacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Genero" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Titulo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "sinopse" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "classificacao" TEXT NOT NULL DEFAULT '16',
    "situacao" TEXT NOT NULL DEFAULT 'PUBLICADO',
    "destaque" BOOLEAN NOT NULL DEFAULT false,
    "novidade" BOOLEAN NOT NULL DEFAULT false,
    "emAlta" BOOLEAN NOT NULL DEFAULT false,
    "popularidade" INTEGER NOT NULL DEFAULT 0,
    "posterUrl" TEXT,
    "arteHeroUrl" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TituloGenero" (
    "tituloId" TEXT NOT NULL,
    "generoId" TEXT NOT NULL,

    PRIMARY KEY ("tituloId", "generoId"),
    CONSTRAINT "TituloGenero_tituloId_fkey" FOREIGN KEY ("tituloId") REFERENCES "Titulo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TituloGenero_generoId_fkey" FOREIGN KEY ("generoId") REFERENCES "Genero" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Temporada" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tituloId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    CONSTRAINT "Temporada_tituloId_fkey" FOREIGN KEY ("tituloId") REFERENCES "Titulo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Episodio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "temporadaId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "duracaoSegundos" INTEGER NOT NULL,
    "miniaturaUrl" TEXT,
    "publicadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Episodio_temporadaId_fkey" FOREIGN KEY ("temporadaId") REFERENCES "Temporada" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ArquivoMidia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "episodioId" TEXT NOT NULL,
    "caminho" TEXT NOT NULL,
    "tamanhoBytes" INTEGER NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ArquivoMidia_episodioId_fkey" FOREIGN KEY ("episodioId") REFERENCES "Episodio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VarianteHls" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "arquivoId" TEXT NOT NULL,
    "altura" INTEGER NOT NULL,
    "taxaBits" INTEGER NOT NULL,
    "playlist" TEXT NOT NULL,
    CONSTRAINT "VarianteHls_arquivoId_fkey" FOREIGN KEY ("arquivoId") REFERENCES "ArquivoMidia" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Legenda" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "episodioId" TEXT NOT NULL,
    "idioma" TEXT NOT NULL,
    "rotulo" TEXT NOT NULL,
    "caminho" TEXT NOT NULL,
    CONSTRAINT "Legenda_episodioId_fkey" FOREIGN KEY ("episodioId") REFERENCES "Episodio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TrabalhoProcessamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "arquivoId" TEXT NOT NULL,
    "situacao" TEXT NOT NULL DEFAULT 'NA_FILA',
    "progresso" INTEGER NOT NULL DEFAULT 0,
    "mensagem" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "TrabalhoProcessamento_arquivoId_fkey" FOREIGN KEY ("arquivoId") REFERENCES "ArquivoMidia" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ItemLista" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "tituloId" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ItemLista_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ItemLista_tituloId_fkey" FOREIGN KEY ("tituloId") REFERENCES "Titulo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Progresso" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "episodioId" TEXT NOT NULL,
    "segundos" INTEGER NOT NULL DEFAULT 0,
    "concluido" BOOLEAN NOT NULL DEFAULT false,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Progresso_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Progresso_episodioId_fkey" FOREIGN KEY ("episodioId") REFERENCES "Episodio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Historico" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "episodioId" TEXT NOT NULL,
    "vistoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Historico_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Historico_episodioId_fkey" FOREIGN KEY ("episodioId") REFERENCES "Episodio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Avaliacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "tituloId" TEXT NOT NULL,
    "nota" INTEGER NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Avaliacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Avaliacao_tituloId_fkey" FOREIGN KEY ("tituloId") REFERENCES "Titulo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Visualizacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "episodioId" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Visualizacao_episodioId_fkey" FOREIGN KEY ("episodioId") REFERENCES "Episodio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SessaoAssistindo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "episodioId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "chaveAnonima" TEXT,
    "ultimoSinal" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SessaoAssistindo_episodioId_fkey" FOREIGN KEY ("episodioId") REFERENCES "Episodio" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SessaoAssistindo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Denuncia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT,
    "referencia" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "resolvida" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Denuncia_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RegistroAdministrativo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT,
    "acao" TEXT NOT NULL,
    "alvo" TEXT,
    "detalhe" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RegistroAdministrativo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Usuario_papel_idx" ON "Usuario"("papel");

-- CreateIndex
CREATE INDEX "Perfil_usuarioId_idx" ON "Perfil"("usuarioId");

-- CreateIndex
CREATE INDEX "Sessao_usuarioId_idx" ON "Sessao"("usuarioId");

-- CreateIndex
CREATE INDEX "Sessao_expiraEm_idx" ON "Sessao"("expiraEm");

-- CreateIndex
CREATE UNIQUE INDEX "TokenVerificacao_token_key" ON "TokenVerificacao"("token");

-- CreateIndex
CREATE INDEX "TokenVerificacao_usuarioId_idx" ON "TokenVerificacao"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "TokenRecuperacao_token_key" ON "TokenRecuperacao"("token");

-- CreateIndex
CREATE INDEX "TokenRecuperacao_usuarioId_idx" ON "TokenRecuperacao"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "TokenConfirmacao_token_key" ON "TokenConfirmacao"("token");

-- CreateIndex
CREATE INDEX "TokenConfirmacao_usuarioId_acao_idx" ON "TokenConfirmacao"("usuarioId", "acao");

-- CreateIndex
CREATE UNIQUE INDEX "Genero_nome_key" ON "Genero"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Genero_slug_key" ON "Genero"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Titulo_slug_key" ON "Titulo"("slug");

-- CreateIndex
CREATE INDEX "Titulo_slug_idx" ON "Titulo"("slug");

-- CreateIndex
CREATE INDEX "Titulo_situacao_popularidade_idx" ON "Titulo"("situacao", "popularidade");

-- CreateIndex
CREATE INDEX "Temporada_tituloId_idx" ON "Temporada"("tituloId");

-- CreateIndex
CREATE UNIQUE INDEX "Temporada_tituloId_numero_key" ON "Temporada"("tituloId", "numero");

-- CreateIndex
CREATE INDEX "Episodio_temporadaId_idx" ON "Episodio"("temporadaId");

-- CreateIndex
CREATE UNIQUE INDEX "Episodio_temporadaId_numero_key" ON "Episodio"("temporadaId", "numero");

-- CreateIndex
CREATE INDEX "ArquivoMidia_episodioId_idx" ON "ArquivoMidia"("episodioId");

-- CreateIndex
CREATE INDEX "VarianteHls_arquivoId_idx" ON "VarianteHls"("arquivoId");

-- CreateIndex
CREATE INDEX "Legenda_episodioId_idx" ON "Legenda"("episodioId");

-- CreateIndex
CREATE INDEX "TrabalhoProcessamento_situacao_idx" ON "TrabalhoProcessamento"("situacao");

-- CreateIndex
CREATE INDEX "ItemLista_usuarioId_idx" ON "ItemLista"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemLista_usuarioId_tituloId_key" ON "ItemLista"("usuarioId", "tituloId");

-- CreateIndex
CREATE INDEX "Progresso_usuarioId_episodioId_idx" ON "Progresso"("usuarioId", "episodioId");

-- CreateIndex
CREATE UNIQUE INDEX "Progresso_usuarioId_episodioId_key" ON "Progresso"("usuarioId", "episodioId");

-- CreateIndex
CREATE INDEX "Historico_usuarioId_vistoEm_idx" ON "Historico"("usuarioId", "vistoEm");

-- CreateIndex
CREATE INDEX "Avaliacao_tituloId_idx" ON "Avaliacao"("tituloId");

-- CreateIndex
CREATE UNIQUE INDEX "Avaliacao_usuarioId_tituloId_key" ON "Avaliacao"("usuarioId", "tituloId");

-- CreateIndex
CREATE INDEX "Visualizacao_episodioId_criadoEm_idx" ON "Visualizacao"("episodioId", "criadoEm");

-- CreateIndex
CREATE INDEX "SessaoAssistindo_episodioId_ultimoSinal_idx" ON "SessaoAssistindo"("episodioId", "ultimoSinal");

-- CreateIndex
CREATE INDEX "Denuncia_resolvida_idx" ON "Denuncia"("resolvida");

-- CreateIndex
CREATE INDEX "RegistroAdministrativo_criadoEm_idx" ON "RegistroAdministrativo"("criadoEm");
