import { sql, type SQL } from 'drizzle-orm';
import { equipeAtiva, type Db } from './permissoes';
import { validarFonteEpisodio, type FonteEpisodio } from './validacao-fontes-episodio';
export type { FonteEpisodio } from './validacao-fontes-episodio';

type LinhaFonte = { id: string; episodio_id: string; nome: string; tipo: string; url: string; ordem: number; ativo: number };
type EpisodioComVideo = { id: string; videoUrl: string };
function tabelaAusente(erro: unknown): boolean {
    for (let i = 0; erro instanceof Error && i < 6; i++, erro = erro.cause) if (/no such table: episodio_fontes/.test(erro.message)) return true;
    return false;
}
/** Recebe somente os episódios que já passaram pelos filtros de disponibilidade. */
export async function anexarFontesEpisodios<T extends EpisodioComVideo>(db: Db, episodios: T[], publico = false, origem?: string): Promise<(T & { fontes: FonteEpisodio[] })[]> {
    if (!episodios.length) return [];
    let linhas: LinhaFonte[];
    try {
        const grupos = Array.from({ length: Math.ceil(episodios.length / 80) }, (_, i) => episodios.slice(i * 80, (i + 1) * 80));
        linhas = (await Promise.all(grupos.map(grupo => db.all<LinhaFonte>(sql`select * from episodio_fontes where episodio_id in (${sql.join(grupo.map(p => sql`${p.id}`), sql`,`)}) order by ordem,id`)))).flat();
    }
    catch (erro) { if (!tabelaAusente(erro)) throw erro; linhas = []; }
    const indice = new Map<string, LinhaFonte[]>();
    for (const linha of linhas) indice.set(linha.episodio_id, [...(indice.get(linha.episodio_id) || []), linha]);
    return episodios.map(p => {
        const persistidas = indice.get(p.id);
        const fontes: FonteEpisodio[] = [];
        if (persistidas) for (const linha of persistidas) {
            try { const fonte = validarFonteEpisodio({ ...linha, ativo: !!linha.ativo }, 0, origem); if (!publico || fonte.ativo) fontes.push(fonte); }
            catch { /* Dados inválidos nunca chegam ao player. */ }
        }
        else if (p.videoUrl) {
            try { fontes.push(validarFonteEpisodio({ id: `legado-${p.id}`, nome: 'Servidor principal', tipo: 'direto', url: p.videoUrl, ordem: 1, ativo: true })); }
            catch { /* Legado sem endereço válido não tem fonte reproduzível. */ }
        }
        return { ...p, fontes };
    });
}
/** Execute depois da atualização e auditoria do episódio no mesmo lote D1. */
export function consultasSalvarFontes(usuarioId: string, episodioId: string, fontes: FonteEpisodio[] | undefined): SQL[] {
    if (fontes === undefined) return [];
    return [sql`delete from episodio_fontes where episodio_id=${episodioId} and ${equipeAtiva(usuarioId, true)}`,
        ...fontes.map(p => sql`insert into episodio_fontes(id,episodio_id,nome,tipo,url,ordem,ativo)
            select ${p.id},${episodioId},${p.nome},${p.tipo},${p.url},${p.ordem},${p.ativo ? 1 : 0}
            where ${equipeAtiva(usuarioId, true)} and exists (select 1 from episodios where id=${episodioId})`)
    ];
}
