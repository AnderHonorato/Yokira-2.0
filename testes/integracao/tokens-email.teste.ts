// Arquivo: testes/integracao/tokens-email.teste.ts
// Tokens de verificacao e recuperacao contra SQLite de verdade: uso unico, prazo,
// hash no banco e a trava que impede pedir link novo a cada segundo.

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { rodarPrisma } from './preparar-banco';

const digerir = (valor: string) => createHash('sha256').update(valor).digest('hex');

let pasta: string;
let banco: (typeof import('../../src/lib/servidor/banco/cliente'))['banco'];
let tokens: typeof import('../../src/lib/servidor/autenticacao/tokens-email');
let usuarioId: string;

beforeAll(async () => {
  pasta = mkdtempSync(join(tmpdir(), 'yokira-tokens-'));
  const url = `file:${join(pasta, 'teste.db')}`;
  rodarPrisma(['migrate', 'deploy'], url);

  // O cliente do Prisma le a URL no import e se guarda no globalThis; por isso a
  // variavel entra antes e o cache sai do caminho.
  process.env.DATABASE_URL = url;
  delete (globalThis as { prisma?: unknown }).prisma;

  ({ banco } = await import('../../src/lib/servidor/banco/cliente'));
  tokens = await import('../../src/lib/servidor/autenticacao/tokens-email');

  const usuario = await banco.usuario.create({
    data: { email: 'token@yokira.local', nome: 'Token', senhaHash: 'hash-falso' }
  });
  usuarioId = usuario.id;
}, 120_000);

afterAll(async () => {
  await banco.$disconnect();
  delete (globalThis as { prisma?: unknown }).prisma;
  rmSync(pasta, { recursive: true, force: true });
});

describe('verificacao de e-mail', () => {
  it('guarda o hash do token, nunca o token cru', async () => {
    const token = await tokens.criarTokenDeVerificacao(usuarioId);
    const gravado = await banco.tokenVerificacao.findFirst({ where: { usuarioId } });

    expect(gravado?.token).toBe(digerir(token));
    expect(gravado?.token).not.toBe(token);
  });

  it('consumir marca o e-mail como verificado e queima o token', async () => {
    const token = await tokens.criarTokenDeVerificacao(usuarioId);

    expect(await tokens.consumirTokenDeVerificacao(token)).toBe(true);
    const usuario = await banco.usuario.findUnique({ where: { id: usuarioId } });
    expect(usuario?.emailVerificado).toBe(true);

    // Segunda vez nao vale.
    expect(await tokens.consumirTokenDeVerificacao(token)).toBe(false);
  });

  it('pedir de novo invalida o link anterior', async () => {
    const antigo = await tokens.criarTokenDeVerificacao(usuarioId);
    const novo = await tokens.criarTokenDeVerificacao(usuarioId);

    expect(await tokens.consumirTokenDeVerificacao(antigo)).toBe(false);
    expect(await tokens.consumirTokenDeVerificacao(novo)).toBe(true);
  });

  it('token vencido e recusado', async () => {
    const token = await tokens.criarTokenDeVerificacao(usuarioId);
    await banco.tokenVerificacao.updateMany({
      where: { usuarioId },
      data: { expiraEm: new Date(Date.now() - 1000) }
    });

    expect(await tokens.consumirTokenDeVerificacao(token)).toBe(false);
  });

  it('token vazio ou inventado nao passa', async () => {
    expect(await tokens.consumirTokenDeVerificacao('')).toBe(false);
    expect(await tokens.consumirTokenDeVerificacao('nao-existe')).toBe(false);
  });
});

describe('recuperacao de senha', () => {
  async function limpar() {
    await banco.tokenRecuperacao.deleteMany({ where: { usuarioId } });
  }

  it('le sem gastar e so gasta no consumo', async () => {
    await limpar();
    const token = (await tokens.criarTokenDeRecuperacao(usuarioId))!;

    // Duas leituras seguidas continuam valendo: o GET da tela nao pode queimar o link.
    expect(await tokens.usuarioDoTokenDeRecuperacao(token)).toBe(usuarioId);
    expect(await tokens.usuarioDoTokenDeRecuperacao(token)).toBe(usuarioId);

    expect(await tokens.consumirTokenDeRecuperacao(token)).toBe(usuarioId);
    expect(await tokens.consumirTokenDeRecuperacao(token)).toBeNull();
    expect(await tokens.usuarioDoTokenDeRecuperacao(token)).toBeNull();
  });

  it('duas abas com o mesmo link: so uma passa', async () => {
    await limpar();
    const token = (await tokens.criarTokenDeRecuperacao(usuarioId))!;

    const resultados = await Promise.all([
      tokens.consumirTokenDeRecuperacao(token),
      tokens.consumirTokenDeRecuperacao(token)
    ]);

    expect(resultados.filter((valor) => valor === usuarioId)).toHaveLength(1);
    expect(resultados.filter((valor) => valor === null)).toHaveLength(1);
  });

  it('pedir de novo no mesmo minuto nao gera outro token', async () => {
    await limpar();
    expect(await tokens.criarTokenDeRecuperacao(usuarioId)).toBeTruthy();
    expect(await tokens.criarTokenDeRecuperacao(usuarioId)).toBeNull();
  });

  it('depois da janela de espera, pode pedir outro', async () => {
    await limpar();
    await tokens.criarTokenDeRecuperacao(usuarioId);

    // Envelhece o pedido anterior alem do intervalo minimo.
    await banco.tokenRecuperacao.updateMany({
      where: { usuarioId },
      data: {
        expiraEm: new Date(
          Date.now() + tokens.VALIDADE_RECUPERACAO_MS - tokens.INTERVALO_ENTRE_PEDIDOS_MS - 5000
        )
      }
    });

    expect(await tokens.criarTokenDeRecuperacao(usuarioId)).toBeTruthy();
  });

  it('token vencido nao redefine nada', async () => {
    await limpar();
    const token = (await tokens.criarTokenDeRecuperacao(usuarioId))!;
    await banco.tokenRecuperacao.updateMany({
      where: { usuarioId },
      data: { expiraEm: new Date(Date.now() - 1000) }
    });

    expect(await tokens.usuarioDoTokenDeRecuperacao(token)).toBeNull();
    expect(await tokens.consumirTokenDeRecuperacao(token)).toBeNull();
  });
});
