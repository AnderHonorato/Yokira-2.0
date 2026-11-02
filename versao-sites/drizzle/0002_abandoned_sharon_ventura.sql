PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_lista` (
	`usuario_id` text NOT NULL,
	`titulo_id` text NOT NULL,
	`criado_em` integer NOT NULL,
	`situacao` text DEFAULT 'planejado' NOT NULL,
	`episodios_vistos` integer DEFAULT 0 NOT NULL,
	`nota` integer,
	`atualizado_em` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`usuario_id`, `titulo_id`),
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "lista_situacao_valida" CHECK("__new_lista"."situacao" in ('planejado','assistindo','concluido','pausado','abandonado')),
	CONSTRAINT "lista_episodios_validos" CHECK("__new_lista"."episodios_vistos" >= 0 and "__new_lista"."episodios_vistos" <= 100000),
	CONSTRAINT "lista_nota_valida" CHECK("__new_lista"."nota" is null or ("__new_lista"."nota" >= 1 and "__new_lista"."nota" <= 10))
);
--> statement-breakpoint
-- A tabela anterior tem apenas as três primeiras colunas. Os valores novos
-- começam nos defaults e a data original é preservada como última atualização.
INSERT INTO `__new_lista`("usuario_id", "titulo_id", "criado_em", "atualizado_em") SELECT "usuario_id", "titulo_id", "criado_em", "criado_em" FROM `lista`;--> statement-breakpoint
DROP TABLE `lista`;--> statement-breakpoint
ALTER TABLE `__new_lista` RENAME TO `lista`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
