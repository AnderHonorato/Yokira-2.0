ALTER TABLE salas ADD COLUMN trancada INTEGER NOT NULL DEFAULT 0 CHECK(trancada IN (0,1));
--> statement-breakpoint
ALTER TABLE perfis_sociais ADD COLUMN avatar TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE perfis_sociais ADD COLUMN banner TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE perfis_sociais ADD COLUMN compartilhar_atividade INTEGER NOT NULL DEFAULT 0 CHECK(compartilhar_atividade IN (0,1));
--> statement-breakpoint
CREATE TABLE atividade_perfis (
 usuario_id TEXT PRIMARY KEY NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
 titulo_id TEXT NOT NULL, episodio_id TEXT NOT NULL REFERENCES episodios(id), atualizado_em INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE chat_imagens (
 id TEXT PRIMARY KEY NOT NULL, usuario_id TEXT NOT NULL REFERENCES usuarios(id),
 chave TEXT NOT NULL UNIQUE, mime TEXT NOT NULL CHECK(mime IN ('image/jpeg','image/png','image/webp')),
 tamanho INTEGER NOT NULL CHECK(tamanho BETWEEN 1 AND 4194304),
 finalidade TEXT NOT NULL CHECK(finalidade IN ('chat','avatar','banner')), criado_em INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX chat_imagens_usuario_criado ON chat_imagens(usuario_id,criado_em);
--> statement-breakpoint
CREATE TABLE chat_mensagens (
 id TEXT PRIMARY KEY NOT NULL, autor_id TEXT NOT NULL REFERENCES usuarios(id),
 corpo TEXT NOT NULL DEFAULT '' CHECK(length(corpo)<=1000),
 imagem_id TEXT REFERENCES chat_imagens(id), sala_id TEXT REFERENCES salas(id),
 oculto INTEGER NOT NULL DEFAULT 0 CHECK(oculto IN (0,1)), criado_em INTEGER NOT NULL,
 CHECK(imagem_id IS NULL OR sala_id IS NULL),
 CHECK(length(trim(corpo))>0 OR imagem_id IS NOT NULL OR sala_id IS NOT NULL)
);
--> statement-breakpoint
CREATE INDEX chat_mensagens_recentes ON chat_mensagens(criado_em,id);
--> statement-breakpoint
CREATE INDEX chat_mensagens_autor ON chat_mensagens(autor_id,criado_em);
--> statement-breakpoint
CREATE INDEX chat_mensagens_imagem ON chat_mensagens(imagem_id,oculto);

--> statement-breakpoint
INSERT OR IGNORE INTO atividade_perfis(usuario_id,titulo_id,episodio_id,atualizado_em)
 SELECT p.usuario_id,e.titulo_id,e.id,p.atualizado_em FROM progresso p JOIN episodios e ON p.titulo_id='episodio:'||e.id
 WHERE NOT EXISTS(SELECT 1 FROM progresso n JOIN episodios anterior ON n.titulo_id='episodio:'||anterior.id
  WHERE n.usuario_id=p.usuario_id AND (n.atualizado_em>p.atualizado_em OR (n.atualizado_em=p.atualizado_em AND n.titulo_id>p.titulo_id)));
