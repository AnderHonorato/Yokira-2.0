CREATE TABLE `denuncias` (
	`id` text PRIMARY KEY NOT NULL,
	`autor_id` text NOT NULL,
	`alvo_tipo` text NOT NULL,
	`alvo_id` text NOT NULL,
	`motivo` text NOT NULL,
	`resolvida` integer DEFAULT false NOT NULL,
	`criado_em` integer NOT NULL,
	FOREIGN KEY (`autor_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `denuncia_por_pessoa_alvo` ON `denuncias` (`autor_id`,`alvo_tipo`,`alvo_id`);--> statement-breakpoint
CREATE INDEX `denuncias_pendentes` ON `denuncias` (`resolvida`,`criado_em`);--> statement-breakpoint
CREATE TABLE `registros_moderacao` (
	`id` text PRIMARY KEY NOT NULL,
	`autor_id` text NOT NULL,
	`acao` text NOT NULL,
	`alvo_tipo` text NOT NULL,
	`alvo_id` text NOT NULL,
	`motivo` text NOT NULL,
	`criado_em` integer NOT NULL,
	FOREIGN KEY (`autor_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `registros_criado` ON `registros_moderacao` (`criado_em`);--> statement-breakpoint
ALTER TABLE `publicacoes` ADD `oculto` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `respostas` ADD `oculto` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `usuarios` ADD `suspenso` integer DEFAULT false NOT NULL;
--> statement-breakpoint
-- A invariável é aplicada pelo banco na mesma transação, inclusive em duas sessões concorrentes.
CREATE TRIGGER preservar_ultimo_administrador_atualizacao
BEFORE UPDATE OF papel, suspenso ON usuarios
WHEN OLD.papel='administrador' AND OLD.suspenso=0
 AND (NEW.papel<>'administrador' OR NEW.suspenso<>0)
 AND (SELECT count(*) FROM usuarios WHERE papel='administrador' AND suspenso=0)<=1
BEGIN SELECT RAISE(ABORT, 'ultimo_administrador'); END;
--> statement-breakpoint
CREATE TRIGGER preservar_ultimo_administrador_exclusao
BEFORE DELETE ON usuarios
WHEN OLD.papel='administrador' AND OLD.suspenso=0
 AND (SELECT count(*) FROM usuarios WHERE papel='administrador' AND suspenso=0)<=1
BEGIN SELECT RAISE(ABORT, 'ultimo_administrador'); END;
--> statement-breakpoint
CREATE TRIGGER validar_papel_insercao BEFORE INSERT ON usuarios
WHEN NEW.papel NOT IN ('membro','editor','moderador','administrador')
BEGIN SELECT RAISE(ABORT, 'papel_invalido'); END;
--> statement-breakpoint
CREATE TRIGGER validar_papel_atualizacao BEFORE UPDATE OF papel ON usuarios
WHEN NEW.papel NOT IN ('membro','editor','moderador','administrador')
BEGIN SELECT RAISE(ABORT, 'papel_invalido'); END;
