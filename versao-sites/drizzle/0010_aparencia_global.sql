CREATE TABLE `aparencia_global` (
	`id` integer PRIMARY KEY NOT NULL,
	`cenario` integer DEFAULT 0 NOT NULL,
	`intensidade` text DEFAULT 'intenso' NOT NULL,
	`atualizado_em` integer DEFAULT 0 NOT NULL,
	CONSTRAINT "aparencia_global_unica" CHECK("aparencia_global"."id"=1),
	CONSTRAINT "aparencia_cenario_valido" CHECK("aparencia_global"."cenario" BETWEEN 0 AND 9),
	CONSTRAINT "aparencia_intensidade_valida" CHECK("aparencia_global"."intensidade" IN ('suave','equilibrado','intenso')),
	CONSTRAINT "aparencia_atualizacao_valida" CHECK("aparencia_global"."atualizado_em">=0)
);

--> statement-breakpoint
INSERT INTO `aparencia_global` (`id`,`cenario`,`intensidade`,`atualizado_em`) VALUES (1,0,'intenso',0);
