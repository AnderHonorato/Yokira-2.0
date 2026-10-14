-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Titulo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "sinopse" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "classificacao" TEXT NOT NULL DEFAULT '16',
    "tipo" TEXT NOT NULL DEFAULT 'SERIE',
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
INSERT INTO "new_Titulo" ("ano", "arteHeroUrl", "atualizadoEm", "classificacao", "criadoEm", "destaque", "emAlta", "id", "nome", "novidade", "popularidade", "posterUrl", "sinopse", "situacao", "slug") SELECT "ano", "arteHeroUrl", "atualizadoEm", "classificacao", "criadoEm", "destaque", "emAlta", "id", "nome", "novidade", "popularidade", "posterUrl", "sinopse", "situacao", "slug" FROM "Titulo";
DROP TABLE "Titulo";
ALTER TABLE "new_Titulo" RENAME TO "Titulo";
CREATE UNIQUE INDEX "Titulo_slug_key" ON "Titulo"("slug");
CREATE INDEX "Titulo_slug_idx" ON "Titulo"("slug");
CREATE INDEX "Titulo_situacao_popularidade_idx" ON "Titulo"("situacao", "popularidade");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
