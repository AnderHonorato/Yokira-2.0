CREATE TABLE `jogos` (
	`id` text PRIMARY KEY NOT NULL,
	`usuario_id` text NOT NULL,
	`modo` text NOT NULL,
	`dados` text NOT NULL,
	`criado_em` integer NOT NULL,
	`atualizado_em` integer NOT NULL,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `jogos_usuario` ON `jogos` (`usuario_id`,`criado_em`);--> statement-breakpoint
CREATE TABLE `limites` (
	`usuario_id` text NOT NULL,
	`janela` text NOT NULL,
	`quantidade` integer NOT NULL,
	PRIMARY KEY(`usuario_id`, `janela`)
);
--> statement-breakpoint
CREATE TABLE `lista` (
	`usuario_id` text NOT NULL,
	`titulo_id` text NOT NULL,
	`criado_em` integer NOT NULL,
	PRIMARY KEY(`usuario_id`, `titulo_id`),
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `opcoes` (
	`publicacao_id` text NOT NULL,
	`titulo_id` text NOT NULL,
	PRIMARY KEY(`publicacao_id`, `titulo_id`),
	FOREIGN KEY (`publicacao_id`) REFERENCES `publicacoes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `progresso` (
	`usuario_id` text NOT NULL,
	`titulo_id` text NOT NULL,
	`segundos` integer NOT NULL,
	`atualizado_em` integer NOT NULL,
	PRIMARY KEY(`usuario_id`, `titulo_id`),
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `publicacoes` (
	`id` text PRIMARY KEY NOT NULL,
	`autor_id` text NOT NULL,
	`tipo` text NOT NULL,
	`titulo` text NOT NULL,
	`corpo` text NOT NULL,
	`criado_em` integer NOT NULL,
	FOREIGN KEY (`autor_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `publicacoes_criado` ON `publicacoes` (`criado_em`);--> statement-breakpoint
CREATE TABLE `respostas` (
	`id` text PRIMARY KEY NOT NULL,
	`publicacao_id` text NOT NULL,
	`autor_id` text NOT NULL,
	`corpo` text NOT NULL,
	`criado_em` integer NOT NULL,
	FOREIGN KEY (`publicacao_id`) REFERENCES `publicacoes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`autor_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `respostas_publicacao` ON `respostas` (`publicacao_id`);--> statement-breakpoint
CREATE TABLE `usuarios` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`papel` text DEFAULT 'membro' NOT NULL,
	`xp` integer DEFAULT 0 NOT NULL,
	`criado_em` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `votos` (
	`publicacao_id` text NOT NULL,
	`usuario_id` text NOT NULL,
	`titulo_id` text NOT NULL,
	PRIMARY KEY(`publicacao_id`, `usuario_id`),
	FOREIGN KEY (`publicacao_id`) REFERENCES `publicacoes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
