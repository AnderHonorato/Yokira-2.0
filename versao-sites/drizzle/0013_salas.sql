CREATE TABLE salas (
 id TEXT PRIMARY KEY NOT NULL,
 dono_id TEXT NOT NULL REFERENCES usuarios(id),
 titulo_id TEXT NOT NULL,
 episodio_id TEXT NOT NULL REFERENCES episodios(id),
 modo TEXT NOT NULL CHECK(modo IN ('dupla','grupo')),
 convite TEXT NOT NULL UNIQUE CHECK(length(convite)=64),
 encerrada INTEGER NOT NULL DEFAULT 0 CHECK(encerrada IN (0,1)),
 pausado INTEGER NOT NULL DEFAULT 1 CHECK(pausado IN (0,1)),
 posicao REAL NOT NULL DEFAULT 0 CHECK(posicao BETWEEN 0 AND 36000),
 revisao INTEGER NOT NULL DEFAULT 0 CHECK(revisao>=0),
 atualizado_em INTEGER NOT NULL,
 criado_em INTEGER NOT NULL
);
CREATE INDEX salas_dono ON salas(dono_id,encerrada);
CREATE TABLE sala_membros (
 sala_id TEXT NOT NULL REFERENCES salas(id) ON DELETE CASCADE,
 usuario_id TEXT NOT NULL REFERENCES usuarios(id),
 ativo INTEGER NOT NULL DEFAULT 1 CHECK(ativo IN (0,1)),
 expulso INTEGER NOT NULL DEFAULT 0 CHECK(expulso IN (0,1)),
 entrou_em INTEGER NOT NULL,
 PRIMARY KEY(sala_id,usuario_id)
);
CREATE INDEX sala_membros_usuario ON sala_membros(usuario_id,ativo,sala_id);
CREATE TABLE sala_mensagens (
 id TEXT PRIMARY KEY NOT NULL,
 sala_id TEXT NOT NULL REFERENCES salas(id) ON DELETE CASCADE,
 autor_id TEXT NOT NULL REFERENCES usuarios(id),
 oculto INTEGER NOT NULL DEFAULT 0 CHECK(oculto IN (0,1)),
 corpo TEXT NOT NULL CHECK(length(corpo) BETWEEN 1 AND 1000),
 criado_em INTEGER NOT NULL
);
CREATE INDEX sala_mensagens_recentes ON sala_mensagens(sala_id,criado_em,id);
