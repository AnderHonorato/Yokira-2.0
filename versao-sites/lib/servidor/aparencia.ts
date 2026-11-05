import { sql } from 'drizzle-orm';
import { equipeAtiva, loteAtomico, type Db, type Usuario } from './permissoes';
import { ErroApi, inteiro, texto } from './validacao';

export type IntensidadeCenario = 'suave' | 'equilibrado' | 'intenso';
export type AparenciaGlobal = { cenario: number; intensidade: IntensidadeCenario; atualizadoEm: number };
export const APARENCIA_PADRAO: AparenciaGlobal = { cenario: 0, intensidade: 'intenso', atualizadoEm: 0 };

export async function obterAparencia(db: Db): Promise<AparenciaGlobal> {
    const [atual] = await db.all<AparenciaGlobal>(sql`select cenario,intensidade,atualizado_em as atualizadoEm from aparencia_global where id=1`);
    return { ...(atual ?? APARENCIA_PADRAO) };
}

/** A identidade vem da sessão; o papel atual é revalidado na própria escrita. */
export async function salvarAparencia(db: Db, usuario: Usuario, payload: Record<string, unknown>): Promise<{ ok: true; aparencia: AparenciaGlobal }> {
    if (usuario.suspenso || usuario.papel !== 'administrador') throw new ErroApi('Somente administradores ativos podem alterar a aparência.', 403);
    const permitidos = new Set(['acao', 'cenario', 'intensidade', 'motivo']);
    if (Object.keys(payload).some(chave => !permitidos.has(chave))) throw new ErroApi('Campo de aparência não permitido.');
    const cenario = inteiro(payload.cenario, 'Cenário', 0, 9);
    const intensidade = payload.intensidade;
    if (intensidade !== 'suave' && intensidade !== 'equilibrado' && intensidade !== 'intenso') throw new ErroApi('Intensidade inválida.');
    const motivo = texto(payload.motivo, 'Motivo', 3, 500);
    const agora = Date.now();
    const [alterado] = await loteAtomico(db, [
        sql`insert into aparencia_global(id,cenario,intensidade,atualizado_em)
            select 1,${cenario},${intensidade},${agora} where ${equipeAtiva(usuario.id, true)}
            on conflict(id) do update set cenario=excluded.cenario,intensidade=excluded.intensidade,
                atualizado_em=max(aparencia_global.atualizado_em+1,excluded.atualizado_em)
            returning cenario,intensidade,atualizado_em as atualizadoEm`,
        sql`insert into registros_moderacao(id,autor_id,acao,alvo_tipo,alvo_id,motivo,criado_em)
            select ${crypto.randomUUID()},${usuario.id},'salvar-aparencia','aparencia','global',${motivo},atualizado_em
            from aparencia_global where id=1 and changes()>0`
    ]);
    if (!alterado.results.length) throw new ErroApi('Sua permissão de administrador não está mais ativa.', 403);
    const aparencia = { ...(alterado.results[0] as AparenciaGlobal) };
    return { ok: true, aparencia };
}
