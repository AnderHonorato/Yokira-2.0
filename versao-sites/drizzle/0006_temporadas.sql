CREATE TABLE `temporadas` (
    `id` text PRIMARY KEY NOT NULL,
    `titulo_id` text NOT NULL,
    `numero` integer NOT NULL CHECK (`numero` BETWEEN 1 AND 10000),
    `nome` text NOT NULL,
    `ordem` integer NOT NULL CHECK (`ordem` BETWEEN 1 AND 100000),
    `arquivado` integer DEFAULT 0 NOT NULL CHECK (`arquivado` IN (0,1)),
    `criado_em` integer NOT NULL,
    `atualizado_em` integer NOT NULL,
    UNIQUE (`titulo_id`,`numero`),
    UNIQUE (`id`,`titulo_id`)
);
--> statement-breakpoint
CREATE TABLE `episodios` (
    `id` text PRIMARY KEY NOT NULL,
    `temporada_id` text,
    `titulo_id` text NOT NULL,
    `numero` integer NOT NULL CHECK (`numero` BETWEEN 1 AND 100000),
    `titulo` text NOT NULL,
    `sinopse` text DEFAULT '' NOT NULL,
    `duracao` integer NOT NULL CHECK (`duracao` BETWEEN 1 AND 600),
    `video_url` text DEFAULT '' NOT NULL,
    `poster` text DEFAULT '' NOT NULL,
    `publicado` integer DEFAULT 0 NOT NULL CHECK (`publicado` IN (0,1)),
    `estreia_em` integer,
    `arquivado` integer DEFAULT 0 NOT NULL CHECK (`arquivado` IN (0,1)),
    `criado_em` integer NOT NULL,
    `atualizado_em` integer NOT NULL,
    CHECK (`publicado`=0 OR length(`video_url`)>0),
    FOREIGN KEY (`temporada_id`,`titulo_id`) REFERENCES `temporadas` (`id`,`titulo_id`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `episodios_numero_unico` ON `episodios` (`titulo_id`,coalesce(`temporada_id`,''),`numero`);
--> statement-breakpoint
CREATE INDEX `episodios_disponibilidade` ON `episodios` (`titulo_id`,`publicado`,`arquivado`,`estreia_em`);
