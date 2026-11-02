export const situacoesColecao = ['planejado', 'assistindo', 'concluido', 'pausado', 'abandonado'] as const;

export type SituacaoColecao = typeof situacoesColecao[number];

export type ItemColecao = {
    tituloId: string;
    situacao: SituacaoColecao;
    episodiosVistos: number;
    nota: number | null;
    criadoEm: string;
    atualizadoEm: string;
};
