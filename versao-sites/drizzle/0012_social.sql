CREATE TABLE perfis_sociais (
 usuario_id text PRIMARY KEY NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
 handle text NOT NULL COLLATE NOCASE UNIQUE,
 bio text NOT NULL DEFAULT '', publico integer NOT NULL DEFAULT 0,
 mostrar_conquistas integer NOT NULL DEFAULT 1, atualizado_em integer NOT NULL,
 CONSTRAINT perfil_handle CHECK(length(handle) BETWEEN 3 AND 24 AND handle=lower(handle) AND handle NOT GLOB '*[^a-z0-9_]*' AND substr(handle,1,1) GLOB '[a-z0-9]'),
 CONSTRAINT perfil_bio CHECK(length(bio)<=280),
 CONSTRAINT perfil_visibilidade CHECK(publico IN (0,1) AND mostrar_conquistas IN (0,1))
);
--> statement-breakpoint
INSERT INTO perfis_sociais(usuario_id,handle,atualizado_em)
 SELECT id,'membro_'||lower(hex(randomblob(8))),criado_em FROM usuarios;
--> statement-breakpoint
CREATE TABLE amizades (
 usuario_a text NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
 usuario_b text NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
 solicitante_id text NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
 estado text NOT NULL DEFAULT 'pendente', criado_em integer NOT NULL, atualizado_em integer NOT NULL,
 PRIMARY KEY(usuario_a,usuario_b),
 CONSTRAINT amizade_par CHECK(usuario_a<usuario_b),
 CONSTRAINT amizade_solicitante CHECK(solicitante_id IN (usuario_a,usuario_b)),
 CONSTRAINT amizade_estado CHECK(estado IN ('pendente','aceita'))
);
--> statement-breakpoint
CREATE INDEX amizades_destinatario ON amizades(usuario_b,estado,atualizado_em);
--> statement-breakpoint
CREATE INDEX amizades_remetente ON amizades(usuario_a,estado,atualizado_em);
--> statement-breakpoint
CREATE TABLE bloqueios_sociais (
 autor_id text NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
 alvo_id text NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
 criado_em integer NOT NULL, PRIMARY KEY(autor_id,alvo_id),
 CONSTRAINT bloqueio_sem_auto CHECK(autor_id<>alvo_id)
);
--> statement-breakpoint
CREATE INDEX bloqueios_alvo ON bloqueios_sociais(alvo_id,autor_id);
