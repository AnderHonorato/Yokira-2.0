ALTER TABLE amizades ADD COLUMN ciclo TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
UPDATE amizades SET ciclo=lower(hex(randomblob(16))) WHERE ciclo='';
--> statement-breakpoint
CREATE TABLE notificacoes_sociais (
 id TEXT PRIMARY KEY NOT NULL,
 usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
 autor_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
 ciclo TEXT NOT NULL,
 tipo TEXT NOT NULL,
 criado_em INTEGER NOT NULL,
 lida_em INTEGER,
 CONSTRAINT notificacao_social_tipo CHECK(tipo IN ('pedido-amizade','amizade-aceita')),
 CONSTRAINT notificacao_social_sem_auto CHECK(usuario_id<>autor_id)
);
--> statement-breakpoint
CREATE UNIQUE INDEX notificacoes_sociais_evento ON notificacoes_sociais(usuario_id,ciclo,tipo);
--> statement-breakpoint
CREATE INDEX notificacoes_sociais_usuario_criado ON notificacoes_sociais(usuario_id,criado_em);
--> statement-breakpoint
INSERT OR IGNORE INTO notificacoes_sociais(id,usuario_id,autor_id,ciclo,tipo,criado_em)
 SELECT lower(hex(randomblob(16))),case when a.solicitante_id=a.usuario_a then a.usuario_b else a.usuario_a end,
 a.solicitante_id,a.ciclo,'pedido-amizade',a.criado_em FROM amizades a
 WHERE a.estado='pendente' AND EXISTS(SELECT 1 FROM usuarios u WHERE u.id=a.usuario_a AND u.suspenso=0)
 AND EXISTS(SELECT 1 FROM usuarios u WHERE u.id=a.usuario_b AND u.suspenso=0)
 AND NOT EXISTS(SELECT 1 FROM bloqueios_sociais b WHERE
  (b.autor_id=a.usuario_a AND b.alvo_id=a.usuario_b) OR (b.autor_id=a.usuario_b AND b.alvo_id=a.usuario_a));
