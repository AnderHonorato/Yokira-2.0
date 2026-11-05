CREATE TABLE `sobreposicoes_conteudo` (
    `tipo` text NOT NULL CHECK (`tipo` IN ('titulo','editorial')),
    `alvo_id` text NOT NULL,
    `dados` text NOT NULL CHECK (json_valid(`dados`) AND json_type(`dados`)='object'),
    `oculto` integer DEFAULT false NOT NULL CHECK (`oculto` IN (0,1)),
    PRIMARY KEY (`tipo`,`alvo_id`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sobreposicoes_slug_unico` ON `sobreposicoes_conteudo` (json_extract(`dados`,'$.slug')) WHERE `tipo`='titulo';
