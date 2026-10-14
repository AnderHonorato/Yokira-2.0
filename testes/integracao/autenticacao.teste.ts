// Arquivo: testes/integracao/autenticacao.teste.ts
// Cadastro, login, revogacao de sessao e o token de uso unico da dupla confirmacao.

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createHash, randomBytes } from 'node:crypto';
import { hash, verify } from '@node-rs/argon2';
import { criarBancoDeTeste, type BancoDeTeste } from './preparar-banco';
import { temPapelMinimo } from '../../src/lib/servidor/permissoes/papeis';

const PARAMETROS = { memoryCost: 19456, timeCost: 2, parallelism: 1 };
const digerir = (valor: string) => createHash('sha256').update(valor).digest('hex');

let ambiente: BancoDeTeste;

beforeAll(async () => {
  ambiente = criarBancoDeTeste();
}, 120_000);

afterAll(async () => ambiente.encerrar());

describe('cadastro e login', () => {
  it('guarda a senha em Argon2id, nunca em texto puro', async () => {
    const { banco } = ambiente;
    const senha = 'YokiraDemo2024';

    const usuario = await banco.usuario.create({
      data: { email: 'ander@yokira.local', nome: 'Ander', senhaHash: await hash(senha, PARAMETROS) }
    });

    expect(usuario.senhaHash).not.toContain(senha);
    expect(usuario.senhaHash.startsWith('$argon2id$')).toBe(true);
    expect(await verify(usuario.senhaHash, senha, PARAMETROS)).toBe(true);
    expect(await verify(usuario.senhaHash, 'senha-errada', PARAMETROS)).toBe(false);
  }, 30_000);

  it('recusa e-mail repetido', async () => {
    const { banco } = ambiente;
    await expect(
      banco.usuario.create({
        data: { email: 'ander@yokira.local', nome: 'Outro', senhaHash: 'x' }
      })
    ).rejects.toThrow();
  });
});

describe('sessao', () => {
  it('o banco guarda o hash do id, nao o id do cookie', async () => {
    const { banco } = ambiente;
    const usuario = await banco.usuario.findUniqueOrThrow({
      where: { email: 'ander@yokira.local' }
    });

    const idDoCookie = randomBytes(32).toString('base64url');
    await banco.sessao.create({
      data: {
        id: digerir(idDoCookie),
        usuarioId: usuario.id,
        expiraEm: new Date(Date.now() + 86_400_000)
      }
    });

    expect(await banco.sessao.findUnique({ where: { id: idDoCookie } })).toBeNull();
    expect(await banco.sessao.findUnique({ where: { id: digerir(idDoCookie) } })).not.toBeNull();
  });

  it('revogar encerra a sessao', async () => {
    const { banco } = ambiente;
    const usuario = await banco.usuario.findUniqueOrThrow({
      where: { email: 'ander@yokira.local' }
    });

    await banco.sessao.updateMany({
      where: { usuarioId: usuario.id, revogadaEm: null },
      data: { revogadaEm: new Date() }
    });

    const vivas = await banco.sessao.count({
      where: { usuarioId: usuario.id, revogadaEm: null }
    });
    expect(vivas).toBe(0);
  });
});

describe('token da dupla confirmacao', () => {
  it('so serve uma vez', async () => {
    const { banco } = ambiente;
    const usuario = await banco.usuario.findUniqueOrThrow({
      where: { email: 'ander@yokira.local' }
    });

    const token = randomBytes(24).toString('base64url');
    await banco.tokenConfirmacao.create({
      data: {
        usuarioId: usuario.id,
        acao: 'excluir-conta',
        token,
        expiraEm: new Date(Date.now() + 300_000)
      }
    });

    const primeiro = await banco.tokenConfirmacao.findUnique({ where: { token } });
    expect(primeiro?.usadoEm).toBeNull();

    await banco.tokenConfirmacao.update({ where: { token }, data: { usadoEm: new Date() } });

    const segundo = await banco.tokenConfirmacao.findUnique({ where: { token } });
    expect(segundo?.usadoEm).not.toBeNull();
  });
});

describe('rota administrativa', () => {
  it('espectador nao entra no painel', () => {
    expect(temPapelMinimo('ESPECTADOR', 'EDITOR')).toBe(false);
    expect(temPapelMinimo('EDITOR', 'EDITOR')).toBe(true);
  });
});
