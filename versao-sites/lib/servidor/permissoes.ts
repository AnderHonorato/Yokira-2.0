import { env } from 'cloudflare:workers';
import { eq, sql, type SQL } from 'drizzle-orm';
import { SQLiteAsyncDialect } from 'drizzle-orm/sqlite-core';
import type { getDb } from '../../db';
import { usuarios } from '../../db/schema';
import { ErroApi } from './validacao';

export type Db = ReturnType<typeof getDb>;
export type Usuario = typeof usuarios.$inferSelect;
export const papeis = ['membro', 'editor', 'moderador', 'administrador'] as const;
export type Papel = typeof papeis[number];
/** O batch nativo D1 mantém autorização, alteração e auditoria na mesma transação. */
export function loteAtomico(db: Db, consultas: SQL[]) {
    const dialeto = new SQLiteAsyncDialect();
    return db.$client.batch(consultas.map(consulta => {
        const { sql: comando, params } = dialeto.sqlToQuery(consulta);
        return db.$client.prepare(comando).bind(...params);
    }));
}

export function podeModerar(usuario: Usuario): boolean {
    return !usuario.suspenso && ['moderador', 'administrador'].includes(usuario.papel);
}
export function exigirModeracao(usuario: Usuario): void {
    if (!podeModerar(usuario)) throw new ErroApi('Sua conta não tem acesso à moderação.', 403);
}
export function exigirAtivo(usuario: Usuario): void {
    if (usuario.suspenso) throw new ErroApi('Sua conta está suspensa. Entre em contato com a administração.', 403);
}
/** Reconfere a permissão na própria escrita para evitar decisões com papel antigo. */
export function equipeAtiva(usuarioId: string, apenasAdmin = false): SQL {
    return sql`exists (select 1 from usuarios agente where agente.id=${usuarioId} and agente.suspenso=0
        and (agente.papel='administrador' or (${!apenasAdmin ? 1 : 0}=1 and agente.papel='moderador')))`;
}
/** Somente identidade injetada pelo dispatch e configuração privada do Worker. */
export async function promoverAdministradorConfigurado(db: Db, usuario: Usuario, cabecalhos: Headers): Promise<Usuario> {
    const configuracao = (env as unknown as { YOKIRA_ADMIN_EMAILS?: string }).YOKIRA_ADMIN_EMAILS || '';
    const permitidos = configuracao.split(',').map(email => email.trim().toLowerCase()).filter(Boolean);
    const email = cabecalhos.get('oai-authenticated-user-email')?.trim().toLowerCase();
    if (!email || !permitidos.includes(email) || usuario.suspenso || usuario.papel === 'administrador') return usuario;
    await loteAtomico(db, [
        sql`update usuarios set papel='administrador' where id=${usuario.id} and suspenso=0 and papel<>'administrador'`,
        sql`insert into registros_moderacao(id,autor_id,acao,alvo_tipo,alvo_id,motivo,criado_em)
            select ${crypto.randomUUID()},${usuario.id},'administrador-configurado','usuario',${usuario.id},
            'Identidade autorizada pela configuração do servidor.',${Date.now()} where changes()>0`
    ]);
    const [atualizado] = await db.select().from(usuarios).where(eq(usuarios.id, usuario.id)).limit(1);
    return atualizado;
}
