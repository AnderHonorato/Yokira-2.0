// Arquivo: testes/unitarios/email-conta.teste.ts
// Conteudo dos e-mails e escolha de transporte. Nada aqui envia nada.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  mensagemDeRecuperacao,
  mensagemDeVerificacao
} from '../../src/lib/servidor/email/mensagens';
import {
  enviarEmail,
  enviarEmailSemQuebrar,
  transporteConfigurado
} from '../../src/lib/servidor/email/enviar';
import {
  enderecoDeRedefinicao,
  enderecoDeVerificacao
} from '../../src/lib/servidor/email/fluxos-de-conta';

const ORIGEM = 'https://yokira.local';

describe('enderecos dos links', () => {
  it('escapa o token na query', () => {
    const token = 'abc+def/ghi=';
    expect(enderecoDeVerificacao(ORIGEM, token)).toBe(
      `${ORIGEM}/verificar-email?token=abc%2Bdef%2Fghi%3D`
    );
    expect(enderecoDeRedefinicao(ORIGEM, token)).toBe(
      `${ORIGEM}/redefinir-senha?token=abc%2Bdef%2Fghi%3D`
    );
  });
});

describe('mensagens', () => {
  it('a de verificacao leva o link e o prazo', () => {
    const mensagem = mensagemDeVerificacao('pessoa@yokira.local', 'Ander', `${ORIGEM}/x`);
    expect(mensagem.para).toBe('pessoa@yokira.local');
    expect(mensagem.assunto).toContain('Confirme seu e-mail');
    expect(mensagem.texto).toContain('Ander');
    expect(mensagem.texto).toContain(`${ORIGEM}/x`);
    expect(mensagem.texto).toContain('24 horas');
  });

  it('a de recuperacao avisa que ignorar mantem a senha', () => {
    const mensagem = mensagemDeRecuperacao('pessoa@yokira.local', 'Ander', `${ORIGEM}/y`);
    expect(mensagem.assunto).toContain('Redefinir sua senha');
    expect(mensagem.texto).toContain('1 hora');
    expect(mensagem.texto).toContain('sua senha continua a mesma');
  });

  it('nao carrega HTML: e-mail transacional vai em texto puro', () => {
    const mensagem = mensagemDeVerificacao('a@b.c', 'Ander', `${ORIGEM}/x`);
    expect(mensagem.texto).not.toContain('<');
  });
});

describe('transporte', () => {
  const guardado = { ...process.env };

  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = { ...guardado };
    vi.restoreAllMocks();
  });

  it('console e o padrao', () => {
    delete process.env.EMAIL_TRANSPORTE;
    expect(transporteConfigurado()).toBe('console');
  });

  it('resend so quando pedido explicitamente', () => {
    process.env.EMAIL_TRANSPORTE = 'resend';
    expect(transporteConfigurado()).toBe('resend');

    process.env.EMAIL_TRANSPORTE = 'qualquer-outra-coisa';
    expect(transporteConfigurado()).toBe('console');
  });

  it('resend sem chave falha em vez de fingir que enviou', async () => {
    process.env.EMAIL_TRANSPORTE = 'resend';
    delete process.env.RESEND_API_KEY;

    await expect(enviarEmail(mensagemDeVerificacao('a@b.c', 'A', 'x'))).rejects.toThrow(
      'RESEND_API_KEY'
    );
  });

  it('o envio tolerante engole a falha e devolve false', async () => {
    process.env.EMAIL_TRANSPORTE = 'resend';
    delete process.env.RESEND_API_KEY;

    await expect(enviarEmailSemQuebrar(mensagemDeVerificacao('a@b.c', 'A', 'x'))).resolves.toBe(
      false
    );
  });

  it('no transporte console o envio da certo e imprime', async () => {
    delete process.env.EMAIL_TRANSPORTE;
    await expect(enviarEmailSemQuebrar(mensagemDeVerificacao('a@b.c', 'A', 'x'))).resolves.toBe(
      true
    );
    expect(console.info).toHaveBeenCalled();
  });
});
