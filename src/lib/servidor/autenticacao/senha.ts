// Arquivo: src/lib/servidor/autenticacao/senha.ts
// Argon2id com parametros do OWASP. Isolei aqui pra trocar o custo num lugar so
// se um dia o servidor de producao for mais fraco que a maquina de desenvolvimento.

import { hash, verify } from '@node-rs/argon2';

const PARAMETROS = {
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1
};

export async function gerarHashDeSenha(senha: string): Promise<string> {
  return hash(senha, PARAMETROS);
}

export async function conferirSenha(hashArmazenado: string, senha: string): Promise<boolean> {
  try {
    return await verify(hashArmazenado, senha, PARAMETROS);
  } catch {
    // Hash corrompido ou de outro algoritmo: trata como senha errada, nunca como sucesso.
    return false;
  }
}
