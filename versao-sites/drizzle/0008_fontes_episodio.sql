CREATE TABLE `episodio_fontes` (
    `id` text PRIMARY KEY NOT NULL,
    `episodio_id` text NOT NULL REFERENCES `episodios` (`id`),
    `nome` text NOT NULL,
    `tipo` text NOT NULL CHECK (`tipo` IN ('direto','drive','incorporado')),
    `url` text NOT NULL,
    `ordem` integer DEFAULT 1 NOT NULL CHECK (`ordem` BETWEEN 1 AND 1000),
    `ativo` integer DEFAULT 1 NOT NULL CHECK (`ativo` IN (0,1))
);
--> statement-breakpoint
CREATE INDEX `episodio_fontes_ordem` ON `episodio_fontes` (`episodio_id`,`ordem`,`id`);
