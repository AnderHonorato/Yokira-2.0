CREATE TABLE banners_configuracao (
 id INTEGER PRIMARY KEY CHECK(id=1),
 intervalo_padrao_segundos INTEGER NOT NULL DEFAULT 8 CHECK(intervalo_padrao_segundos BETWEEN 3 AND 60),
 atualizado_em INTEGER NOT NULL DEFAULT 0 CHECK(atualizado_em>=0)
);
--> statement-breakpoint
INSERT INTO banners_configuracao(id) VALUES(1);
--> statement-breakpoint
CREATE TABLE banners (
 id TEXT PRIMARY KEY NOT NULL,
 titulo_id TEXT NOT NULL,
 imagem TEXT NOT NULL,
 personagem TEXT NOT NULL DEFAULT '',
 link TEXT NOT NULL DEFAULT '',
 intervalo_segundos INTEGER CHECK(intervalo_segundos IS NULL OR intervalo_segundos BETWEEN 3 AND 60),
 ordem INTEGER NOT NULL DEFAULT 0 CHECK(ordem BETWEEN 0 AND 999),
 ativo INTEGER NOT NULL DEFAULT 1 CHECK(ativo IN(0,1)),
 arquivado INTEGER NOT NULL DEFAULT 0 CHECK(arquivado IN(0,1)),
 atualizado_em INTEGER NOT NULL DEFAULT 0 CHECK(atualizado_em>=0)
);
--> statement-breakpoint
CREATE INDEX banners_publicos ON banners(arquivado,ativo,ordem);
--> statement-breakpoint
INSERT INTO banners(id,titulo_id,imagem,personagem,ordem) VALUES
 ('one-piece','2','/arte/banners/one-piece-cenario.webp','/arte/banners/one-piece-personagem.webp',0),
 ('naruto','4','/arte/banners/naruto-cenario.webp','/arte/banners/naruto-personagem.webp',1),
 ('bleach','1','/arte/banners/bleach-cenario.webp','/arte/banners/bleach-personagem.webp',2);
