CREATE TABLE conquistas_usuario (
 usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
 badge_id TEXT NOT NULL,
 obtida_em INTEGER NOT NULL,
 PRIMARY KEY(usuario_id,badge_id)
);
--> statement-breakpoint
CREATE TABLE conquistas_destaques (
 usuario_id TEXT NOT NULL,
 badge_id TEXT NOT NULL,
 posicao INTEGER NOT NULL CHECK(posicao BETWEEN 0 AND 2),
 PRIMARY KEY(usuario_id,badge_id),
 UNIQUE(usuario_id,posicao),
 FOREIGN KEY(usuario_id,badge_id) REFERENCES conquistas_usuario(usuario_id,badge_id) ON DELETE CASCADE
);
--> statement-breakpoint
ALTER TABLE notificacoes ADD COLUMN badge_id TEXT;
--> statement-breakpoint
UPDATE notificacoes SET badge_id=evento WHERE tipo='conquista' AND evento IN ('boas-vindas','primeira-publicacao','primeiro-jogo','primeira-colecao');
--> statement-breakpoint
INSERT OR IGNORE INTO conquistas_usuario(usuario_id,badge_id,obtida_em)
SELECT usuario_id,badge_id,criado_em FROM notificacoes WHERE badge_id IS NOT NULL;
