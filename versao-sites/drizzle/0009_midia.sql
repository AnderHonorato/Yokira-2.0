CREATE TABLE `midia` (
    `id` text PRIMARY KEY NOT NULL,
    `dono_id` text NOT NULL REFERENCES `usuarios` (`id`),
    `chave` text NOT NULL UNIQUE,
    `nome` text NOT NULL,
    `tipo` text NOT NULL CHECK (`tipo` IN ('video','imagem')),
    `mime` text NOT NULL CHECK (`mime` IN ('video/mp4','video/webm','image/png','image/jpeg','image/webp','image/avif')),
    `tamanho` integer NOT NULL CHECK (`tamanho` BETWEEN 1 AND 104857600),
    `status` text NOT NULL CHECK (`status` IN ('enviando','pronto','falhou')),
    `criado_em` integer NOT NULL,
    `atualizado_em` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `midia_dono_status` ON `midia` (`dono_id`,`status`);
