// Fila persistente de HLS: o banco e a origem da verdade para a conversao.
// Funciona com execucao imediata e trabalhador separado para retomar apos reinicio.

import { banco } from '../banco/cliente.js';
import { converterArquivo } from './transcodificar.js';

const BATIMENTO_MS = 20_000;
const PRAZO_SEM_BATIMENTO_MS = 10 * 60_000;

export function limiteDeRecuperacao(agora = Date.now()): Date {
  return new Date(agora - PRAZO_SEM_BATIMENTO_MS);
}

export async function enfileirarArquivo(arquivoId: string): Promise<string> {
  const existente = await banco.trabalhoProcessamento.findFirst({
    where: { arquivoId, situacao: { in: ['NA_FILA', 'PROCESSANDO'] } },
    orderBy: { criadoEm: 'desc' },
    select: { id: true }
  });
  if (existente) return existente.id;

  const trabalho = await banco.trabalhoProcessamento.create({
    data: { arquivoId, situacao: 'NA_FILA' },
    select: { id: true }
  });
  return trabalho.id;
}

/** Apenas um processo consegue reivindicar cada trabalho NA_FILA. */
export async function executarTrabalho(trabalhoId: string): Promise<boolean> {
  const reivindicado = await banco.trabalhoProcessamento.updateMany({
    where: { id: trabalhoId, situacao: 'NA_FILA' },
    data: { situacao: 'PROCESSANDO', progresso: 0, mensagem: null }
  });
  if (reivindicado.count !== 1) return false;

  const trabalho = await banco.trabalhoProcessamento.findUnique({
    where: { id: trabalhoId },
    select: { arquivoId: true }
  });
  const batimento = setInterval(() => {
    void banco.trabalhoProcessamento
      .updateMany({
        where: { id: trabalhoId, situacao: 'PROCESSANDO' },
        data: { atualizadoEm: new Date() }
      })
      .catch((erro) => console.error('Falha no batimento da conversão HLS:', erro));
  }, BATIMENTO_MS);
  batimento.unref();

  try {
    if (!trabalho) throw new Error('O trabalho de vídeo não foi encontrado.');
    await converterArquivo(trabalho.arquivoId, trabalhoId);
  } catch (falha) {
    const mensagem = falha instanceof Error ? falha.message.slice(0, 500) : 'Falha no processamento.';
    await banco.trabalhoProcessamento.updateMany({
      where: { id: trabalhoId, situacao: 'PROCESSANDO' },
      data: { situacao: 'FALHOU', mensagem }
    });
  } finally {
    clearInterval(batimento);
  }
  return true;
}

/** Serve para o fluxo atual: agendamento durável, execução imediata sem aguardar FFmpeg. */
export async function processarArquivo(arquivoId: string): Promise<void> {
  const trabalhoId = await enfileirarArquivo(arquivoId);
  void executarTrabalho(trabalhoId).catch((erro) => {
    console.error('Falha ao iniciar trabalho HLS agendado:', erro);
  });
}

/** So recupera PROCESSANDO sem batimento por dez minutos; nunca reinicia concluidos. */
export async function recuperarInterrompidos(agora = Date.now()): Promise<number> {
  const recuperados = await banco.trabalhoProcessamento.updateMany({
    where: {
      situacao: 'PROCESSANDO',
      atualizadoEm: { lt: limiteDeRecuperacao(agora) }
    },
    data: {
      situacao: 'NA_FILA',
      progresso: 0,
      mensagem: 'Trabalho interrompido; aguardando nova tentativa.'
    }
  });
  return recuperados.count;
}

/** Chamada pelo trabalhador Node. A reivindicacao atomica evita repetir o mesmo job. */
export async function consumirPendentes(maximo = 5): Promise<number> {
  const pendentes = await banco.trabalhoProcessamento.findMany({
    where: { situacao: 'NA_FILA' },
    orderBy: { criadoEm: 'asc' },
    select: { id: true },
    take: maximo
  });
  let processados = 0;
  for (const trabalho of pendentes) {
    if (await executarTrabalho(trabalho.id)) processados++;
  }
  return processados;
}
