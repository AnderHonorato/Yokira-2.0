CREATE TABLE auth_usuarios (
 id TEXT PRIMARY KEY NOT NULL, nome TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
 email_verificado INTEGER NOT NULL DEFAULT 0 CHECK(email_verificado IN (0,1)), imagem TEXT,
 criado_em INTEGER NOT NULL, atualizado_em INTEGER NOT NULL
);
CREATE TABLE auth_sessoes (
 id TEXT PRIMARY KEY NOT NULL, token TEXT NOT NULL UNIQUE, usuario_id TEXT NOT NULL REFERENCES auth_usuarios(id) ON DELETE CASCADE,
 expira_em INTEGER NOT NULL, criado_em INTEGER NOT NULL, atualizado_em INTEGER NOT NULL, ip TEXT, agente TEXT
);
CREATE INDEX auth_sessoes_usuario_idx ON auth_sessoes(usuario_id);
CREATE TABLE auth_credenciais (
 id TEXT PRIMARY KEY NOT NULL, conta_id TEXT NOT NULL, provedor_id TEXT NOT NULL,
 usuario_id TEXT NOT NULL REFERENCES auth_usuarios(id) ON DELETE CASCADE,
 token_acesso TEXT, token_renovacao TEXT, token_identidade TEXT, acesso_expira_em INTEGER,
 renovacao_expira_em INTEGER, escopo TEXT, senha_hash TEXT, criado_em INTEGER NOT NULL, atualizado_em INTEGER NOT NULL,
 UNIQUE(provedor_id,conta_id)
);
CREATE INDEX auth_credenciais_usuario_idx ON auth_credenciais(usuario_id);
CREATE TABLE auth_verificacoes (
 id TEXT PRIMARY KEY NOT NULL, identificador TEXT NOT NULL, valor TEXT NOT NULL,
 expira_em INTEGER NOT NULL, criado_em INTEGER NOT NULL, atualizado_em INTEGER NOT NULL
);
CREATE INDEX auth_verificacoes_identificador_idx ON auth_verificacoes(identificador);
CREATE TABLE auth_limites (
 id TEXT PRIMARY KEY NOT NULL, chave TEXT NOT NULL UNIQUE, quantidade INTEGER NOT NULL, ultima_requisicao INTEGER NOT NULL
);
CREATE TABLE auth_tentativas (
 chave TEXT PRIMARY KEY NOT NULL, quantidade INTEGER NOT NULL, expira_em INTEGER NOT NULL
);
CREATE INDEX auth_tentativas_expira_idx ON auth_tentativas(expira_em);
