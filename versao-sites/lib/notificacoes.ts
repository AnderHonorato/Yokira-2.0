export type Notificacao = {
    id: string; tipo: 'conquista' | 'nivel'; titulo: string; descricao: string; destino: string;
    badgeId?: string | null;
    criadoEm: number; lidaEm: number | null; celebradaEm: number | null;
};
/** Só destinos internos conhecidos; não interpreta URLs, HTML ou protocolos do payload. */
export function origemNotificacao(destino: unknown): { pagina: string; params: Record<string, string>; caminho: string } {
    const padrao = { pagina: 'perfil', params: {}, caminho: '/?p=perfil' };
    if (typeof destino !== 'string' || !destino.startsWith('/?p=') || destino.length > 400) return padrao;
    const url = new URL(destino, 'https://yokira.invalid');
    if (url.origin !== 'https://yokira.invalid' || url.pathname !== '/' || url.hash) return padrao;
    const pagina = url.searchParams.get('p') || '';
    const permitidos: Record<string, string[]> = { perfil: [], forum: ['post'], jogos: ['modo'], listas: ['editar', 'post'], amizades: [], salas: [], sala: ['salaId'] };
    if (!Object.hasOwn(permitidos, pagina)) return padrao;
    const params: Record<string, string> = {};
    for (const [nome, valor] of url.searchParams) {
        if (nome === 'p') continue;
        if (!permitidos[pagina].includes(nome) || !/^[a-zA-Z0-9_-]{1,160}$/.test(valor)) return padrao;
        if (nome === 'modo' && !['adivinhe', 'gacha', 'duelo', 'tier', 'quiz', 'torneio'].includes(valor)) return padrao;
        params[nome] = valor;
    }
    return { pagina, params, caminho: '/?' + new URLSearchParams({ p: pagina, ...params }).toString() };
}
