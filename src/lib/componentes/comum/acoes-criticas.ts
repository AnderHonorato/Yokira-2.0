// Arquivo: src/lib/componentes/comum/acoes-criticas.ts
// Catalogo das acoes que exigem dupla confirmacao. Ficam juntas pra ninguem criar uma
// nova acao destrutiva "esquecendo" de passar pelo dialogo.

import type { ExigenciaDoPasso2 } from './dialogo-confirmacao';

export interface AcaoCritica {
  chave: string;
  titulo: string;
  descricao: string;
  aviso: string;
  rotuloDoBotao: string;
  exigencia: ExigenciaDoPasso2;
  /** Onde a acao acontece: no servidor, no navegador, ou nos dois. */
  destino: 'servidor' | 'navegador';
}

export const ACOES_CRITICAS: AcaoCritica[] = [
  {
    chave: 'limpar-dados-baixados',
    titulo: 'Limpar dados baixados',
    descricao:
      'Apaga o catálogo e as imagens guardadas neste aparelho. O app volta a baixar tudo no próximo acesso.',
    aviso: 'O modo offline deixa de funcionar até você abrir o app com internet de novo.',
    rotuloDoBotao: 'Limpar',
    exigencia: { rotuloDaCaixa: 'Entendi que esta ação não pode ser desfeita' },
    destino: 'navegador'
  },
  {
    chave: 'limpar-historico',
    titulo: 'Limpar histórico de exibição',
    descricao: 'Remove todo o registro do que você assistiu nesta conta.',
    aviso: 'O histórico não pode ser recuperado depois de apagado.',
    rotuloDoBotao: 'Limpar histórico',
    exigencia: { rotuloDaCaixa: 'Entendi que esta ação não pode ser desfeita' },
    destino: 'servidor'
  },
  {
    chave: 'encerrar-sessoes',
    titulo: 'Encerrar todas as sessões',
    descricao: 'Desconecta a sua conta de todos os aparelhos, incluindo este.',
    aviso: 'Você vai precisar entrar de novo em cada aparelho.',
    rotuloDoBotao: 'Encerrar sessões',
    exigencia: { rotuloDaCaixa: 'Entendi que esta ação não pode ser desfeita' },
    destino: 'servidor'
  },
  {
    chave: 'excluir-conta',
    titulo: 'Excluir minha conta',
    descricao:
      'Remove a conta, a lista, o progresso e as avaliações. Nada disso volta depois de confirmado.',
    aviso: 'Esta ação é definitiva e não pode ser desfeita.',
    rotuloDoBotao: 'Excluir conta',
    exigencia: { palavraChave: 'EXCLUIR' },
    destino: 'servidor'
  }
];
