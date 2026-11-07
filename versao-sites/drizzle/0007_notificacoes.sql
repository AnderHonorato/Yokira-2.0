CREATE TABLE `notificacoes` (
 `id` text PRIMARY KEY NOT NULL,
 `usuario_id` text NOT NULL REFERENCES `usuarios`(`id`) ON DELETE CASCADE,
 `evento` text NOT NULL,
 `tipo` text NOT NULL CHECK (`tipo` IN ('conquista','nivel')),
 `titulo` text NOT NULL,
 `descricao` text NOT NULL,
 `destino` text NOT NULL CHECK (substr(`destino`,1,4)='/?p=' AND length(`destino`)<=400 AND instr(`destino`,':')=0 AND instr(`destino`,char(92))=0),
 `criado_em` integer NOT NULL,
 `lida_em` integer,
 `celebrada_em` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notificacoes_evento_usuario` ON `notificacoes` (`usuario_id`,`evento`);
--> statement-breakpoint
CREATE INDEX `notificacoes_usuario_criado` ON `notificacoes` (`usuario_id`,`criado_em`);
