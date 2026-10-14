// Arquivo: src/lib/servidor/email/enviar.ts
// Envio de e-mail com dois transportes. `console` e o padrao de desenvolvimento:
// imprime o link no terminal, entao da pra testar o fluxo inteiro sem contratar nada.
// `resend` fala HTTP direto com a API — sem dependencia nova no package.json.

import { appendFile } from 'node:fs/promises';
import type { Mensagem } from './mensagens.js';

export type Transporte = 'console' | 'arquivo' | 'resend';

const REMETENTE_PADRAO = 'Yōkira Animes <nao-responda@yokira.local>';

export function transporteConfigurado(): Transporte {
  const escolhido = process.env.EMAIL_TRANSPORTE;
  if (escolhido === 'resend' || escolhido === 'arquivo') return escolhido;
  return 'console';
}

async function enviarPeloResend(mensagem: Mensagem): Promise<void> {
  const chave = process.env.RESEND_API_KEY;
  if (!chave) throw new Error('EMAIL_TRANSPORTE=resend exige RESEND_API_KEY.');

  const resposta = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${chave}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      from: process.env.EMAIL_REMETENTE ?? REMETENTE_PADRAO,
      to: [mensagem.para],
      subject: mensagem.assunto,
      text: mensagem.texto
    })
  });

  if (!resposta.ok) {
    // Corpo da resposta entra no log do servidor, nunca na tela de quem pediu.
    throw new Error(`Resend recusou o envio (${resposta.status}): ${await resposta.text()}`);
  }
}

function imprimirNoTerminal(mensagem: Mensagem): void {
  console.info(
    [
      '',
      '--- E-MAIL (transporte: console) ---',
      `Para: ${mensagem.para}`,
      `Assunto: ${mensagem.assunto}`,
      '',
      mensagem.texto,
      '------------------------------------',
      ''
    ].join('\n')
  );
}

/**
 * Grava uma linha JSON por mensagem. Serve pra conferir o e-mail sem cliente de
 * e-mail nenhum — e e o que deixa o teste de ponta a ponta seguir o link de verdade.
 */
async function gravarEmArquivo(mensagem: Mensagem): Promise<void> {
  const destino = process.env.EMAIL_ARQUIVO;
  if (!destino) throw new Error('EMAIL_TRANSPORTE=arquivo exige EMAIL_ARQUIVO.');
  await appendFile(
    destino,
    `${JSON.stringify({ ...mensagem, em: new Date().toISOString() })}\n`,
    'utf8'
  );
}

export async function enviarEmail(mensagem: Mensagem): Promise<void> {
  switch (transporteConfigurado()) {
    case 'resend':
      await enviarPeloResend(mensagem);
      return;
    case 'arquivo':
      await gravarEmArquivo(mensagem);
      return;
    default:
      imprimirNoTerminal(mensagem);
  }
}

/**
 * Envia sem deixar a falha subir. Usado onde o e-mail e efeito colateral: cadastro
 * nao pode falhar porque o SMTP caiu, e a tela de recuperacao nao pode contar quais
 * e-mails existem so porque um envio deu erro.
 */
export async function enviarEmailSemQuebrar(mensagem: Mensagem): Promise<boolean> {
  try {
    await enviarEmail(mensagem);
    return true;
  } catch (erro) {
    console.error('Falha ao enviar e-mail:', erro instanceof Error ? erro.message : erro);
    return false;
  }
}
