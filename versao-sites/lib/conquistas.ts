export type RaridadeConquista = 'comum' | 'rara' | 'epica' | 'lendaria';
export type FormaConquista = 'semente' | 'escudo' | 'losango' | 'hexagono' | 'estrela' | 'coroa';
export type ConquistaDefinicao = {
 badgeId: string; titulo: string; descricao: string; raridade: RaridadeConquista;
 forma: FormaConquista; cor: string; meta: number; feito: string;
};
const definir = (badgeId: string, titulo: string, descricao: string, raridade: RaridadeConquista,
 forma: FormaConquista, cor: string, meta: number, feito: string): ConquistaDefinicao =>
 ({ badgeId, titulo, descricao, raridade, forma, cor, meta, feito });
export const conquistas: readonly ConquistaDefinicao[] = [
 definir('boas-vindas', 'Sua jornada começa', 'Você agora faz parte do universo Yokira.', 'comum', 'semente', '#70e0ad', 1, 'conta'),
 definir('primeira-publicacao', 'Sua voz na comunidade', 'Compartilhe sua primeira publicação visível.', 'comum', 'escudo', '#7cbeff', 1, 'publicacoes'),
 definir('primeiro-jogo', 'Primeiro desafio', 'Comece um jogo Yokira.', 'comum', 'losango', '#ffb678', 1, 'jogos'),
 definir('primeira-colecao', 'Uma coleção só sua', 'Salve o primeiro título na sua lista.', 'comum', 'hexagono', '#a6e680', 1, 'colecao'),
 definir('colecionador', 'Olhar curioso', 'Reúna 10 títulos na sua lista.', 'rara', 'escudo', '#46dccc', 10, 'colecao'),
 definir('biblioteca-viva', 'Biblioteca viva', 'Reúna 50 títulos na sua lista.', 'epica', 'hexagono', '#b89aff', 50, 'colecao'),
 definir('tres-finais', 'Além do último episódio', 'Conclua 3 títulos na sua lista.', 'rara', 'losango', '#68c7ff', 3, 'concluidos'),
 definir('vinte-finais', 'Crônicas completas', 'Conclua 20 títulos na sua lista.', 'epica', 'estrela', '#df96ff', 20, 'concluidos'),
 definir('cem-finais', 'Guardião de histórias', 'Conclua 100 títulos na sua lista.', 'lendaria', 'coroa', '#ffd479', 100, 'concluidos'),
 definir('critico', 'Olhar crítico', 'Avalie 10 títulos da sua lista.', 'rara', 'estrela', '#ffb18b', 10, 'avaliados'),
 definir('cronista', 'Cronista da comunidade', 'Publique 5 tópicos visíveis no fórum.', 'rara', 'hexagono', '#91b7ff', 5, 'forum'),
 definir('conversador', 'Uma boa conversa', 'Escreva 10 respostas visíveis na comunidade.', 'rara', 'semente', '#8ce8c3', 10, 'respostas'),
 definir('voz-ativa', 'Voz ativa', 'Participe de 10 votações.', 'rara', 'escudo', '#e7a7ce', 10, 'votos'),
 definir('dez-desafios', 'Espírito de desafio', 'Conclua 10 partidas.', 'epica', 'losango', '#ff9c74', 10, 'jogosConcluidos'),
 definir('explorador-jogos', 'Todos os caminhos', 'Experimente 4 modos de jogo.', 'epica', 'estrela', '#a9a0ff', 4, 'modos'),
 definir('cinco-vitorias', 'Chama da vitória', 'Vença 5 partidas de adivinhação.', 'epica', 'escudo', '#ff849c', 5, 'vitorias'),
 definir('primeiro-vinculo', 'Primeiro vínculo', 'Tenha uma amizade aceita na comunidade.', 'rara', 'semente', '#f5a4df', 1, 'amizades'),
 definir('anfitriao', 'A casa é sua', 'Crie sua primeira sala para assistir com companhia.', 'rara', 'hexagono', '#8ed3ed', 1, 'salasCriadas'),
 definir('companhia', 'Sessões compartilhadas', 'Participe de 3 salas de outras pessoas.', 'epica', 'estrela', '#b9dfa0', 3, 'salasParticipadas'),
 definir('presenca-lendaria', 'Presença lendária', 'Alcance 5.000 XP com sua participação.', 'lendaria', 'coroa', '#ffe59b', 5000, 'xp'),
];
export type ConquistaProgresso = Omit<ConquistaDefinicao, 'feito'> & { progresso: number; obtidaEm: number | null };
export type HallConquistas = { conquistas: ConquistaProgresso[]; destaques: string[] };
export const nomesRaridades: Record<RaridadeConquista, string> = { comum: 'Comum', rara: 'Rara', epica: 'Épica', lendaria: 'Lendária' };
export function obterConquista(badgeId: string) { return conquistas.find(item => item.badgeId === badgeId); }
