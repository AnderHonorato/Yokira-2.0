// Arquivo: src/lib/servidor/banco/estreia.ts
// Um lugar so pra responder "este episodio ja esta no ar?".
//
// Espalhar essa condicao pelas consultas foi exatamente como `publicadoEm` acabou
// nunca sendo filtrado em lugar nenhum: a coluna existia, era escrita a cada
// insercao e ninguem olhava pra ela. Com uma funcao unica, quem escrever a proxima
// consulta de episodio tropeca nela.

/** Condicao do Prisma para episodio que ja estreou. */
export function jaEstreou(agora: Date = new Date()) {
  return { publicadoEm: { lte: agora } };
}

/** Mesma regra, para um episodio que ja veio do banco. */
export function estreou(publicadoEm: Date, agora: Date = new Date()): boolean {
  return publicadoEm.getTime() <= agora.getTime();
}

/**
 * Quem edita precisa ver e abrir o que ainda nao estreou pra conferir antes da hora.
 * Espectador, nao: para ele o episodio agendado simplesmente nao existe ainda.
 */
export function podeVerAntesDaEstreia(papel: string | undefined): boolean {
  return papel === 'EDITOR' || papel === 'MODERADOR' || papel === 'ADMINISTRADOR';
}
