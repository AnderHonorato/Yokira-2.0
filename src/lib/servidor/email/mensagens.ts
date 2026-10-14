// Arquivo: src/lib/servidor/email/mensagens.ts
// Texto dos dois e-mails que o sistema manda. Puro de proposito: da pra testar o
// conteudo sem enviar nada e sem subir servidor.
//
// So texto, sem HTML: e-mail transacional curto nao precisa de layout, e texto puro
// nao cai em filtro de spam por imagem quebrada.

export interface Mensagem {
  para: string;
  assunto: string;
  texto: string;
}

const ASSINATURA = 'Yōkira Animes';

export function mensagemDeVerificacao(para: string, nome: string, url: string): Mensagem {
  return {
    para,
    assunto: 'Confirme seu e-mail — Yōkira Animes',
    texto: [
      `Olá, ${nome}.`,
      '',
      'Confirme seu e-mail para ativar todos os recursos da sua conta:',
      url,
      '',
      'O link vale por 24 horas.',
      'Se não foi você que criou a conta, ignore esta mensagem.',
      '',
      ASSINATURA
    ].join('\n')
  };
}

export function mensagemDeRecuperacao(para: string, nome: string, url: string): Mensagem {
  return {
    para,
    assunto: 'Redefinir sua senha — Yōkira Animes',
    texto: [
      `Olá, ${nome}.`,
      '',
      'Recebemos um pedido para redefinir a senha da sua conta. Para escolher uma nova:',
      url,
      '',
      'O link vale por 1 hora e só pode ser usado uma vez.',
      'Se não foi você que pediu, ignore esta mensagem — sua senha continua a mesma.',
      '',
      ASSINATURA
    ].join('\n')
  };
}
