PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_votos` (
	`publicacao_id` text NOT NULL,
	`usuario_id` text NOT NULL,
	`titulo_id` text NOT NULL,
	PRIMARY KEY(`publicacao_id`, `usuario_id`),
	FOREIGN KEY (`publicacao_id`) REFERENCES `publicacoes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`publicacao_id`,`titulo_id`) REFERENCES `opcoes`(`publicacao_id`,`titulo_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_votos`("publicacao_id", "usuario_id", "titulo_id") SELECT "publicacao_id", "usuario_id", "titulo_id" FROM `votos`;--> statement-breakpoint
DROP TABLE `votos`;--> statement-breakpoint
ALTER TABLE `__new_votos` RENAME TO `votos`;--> statement-breakpoint
PRAGMA foreign_keys=ON;