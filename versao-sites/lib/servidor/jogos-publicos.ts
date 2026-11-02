export type DadosJogo = {
    respostaId?: string;
    tentativas?: {
        tituloId: string;
        acertou: boolean;
    }[];
    concluido?: boolean;
    ganhou?: boolean;
    limite?: number;
    dica?: {
        ano: number;
        generos: readonly string[];
        tipo: string;
    };
    tituloId?: string;
    restantes?: number;
    vencedorId?: string;
    perdedorId?: string;
    tiers?: Record<string, string[]>;
    questoes?: {
        respostaId: string;
        opcoes: string[];
    }[];
    indice?: number;
    pontos?: number;
    ultima?: {
        acertou: boolean;
        respostaId: string;
    };
    fila?: string[];
    proxima?: string[];
    rodada?: number;
    campeaoId?: string;
    versao?: number;
};
type Jogo = {
    id: string;
    modo: string;
    dados: string;
};
export function dadosPublicos(jogo: Jogo, obterSinopse: (id: string) => string | undefined) {
    const dados = JSON.parse(jogo.dados) as DadosJogo;
    if (jogo.modo === 'adivinhe' && !dados.concluido)
        delete dados.respostaId;
    if (jogo.modo === 'quiz') {
        const questao = dados.questoes?.[dados.indice || 0], sinopse = questao ? obterSinopse(questao.respostaId) : undefined;
        return { id: jogo.id, modo: jogo.modo, indice: dados.indice, pontos: dados.pontos, concluido: dados.concluido, versao: dados.versao, ultima: dados.ultima, ...(sinopse ? { pergunta: { sinopse, opcoes: questao!.opcoes } } : {}) };
    }
    if (jogo.modo === 'torneio')
        return { id: jogo.id, modo: jogo.modo, rodada: dados.rodada, versao: dados.versao, par: dados.fila?.slice(0, 2) || [], concluido: dados.concluido, campeaoId: dados.campeaoId, vencedores: dados.proxima || [] };
    return { id: jogo.id, modo: jogo.modo, ...dados };
}
