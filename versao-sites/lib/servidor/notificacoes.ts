import { sql } from 'drizzle-orm';
import { loteAtomico, type Db, type Usuario } from './permissoes';
import { ErroApi } from './validacao';
import { origemNotificacao, type Notificacao } from '../notificacoes';

export type { Notificacao } from '../notificacoes';
/** Executar logo após conceder XP no mesmo lote: registra a atividade que cruzou o nível. */
export function registrarNivelAlcancado(usuarioId: string, pontos: number, destino: string) {
    const origem = origemNotificacao(destino).caminho;
    return sql`insert or ignore into notificacoes(id,usuario_id,evento,tipo,titulo,descricao,destino,criado_em)
        select lower(hex(randomblob(16))),id,'nivel:'||(cast(xp/100 as integer)+1),'nivel',
            'Nível '||(cast(xp/100 as integer)+1)||' alcançado',
            'Esta participação abriu um novo capítulo da sua jornada.',${origem},${Date.now()}
        from usuarios where id=${usuarioId} and changes()>0 and xp>=100 and xp%100<${pontos}`;
}
const colunas = sql`id,tipo,titulo,descricao,destino,criado_em as criadoEm,lida_em as lidaEm,celebrada_em as celebradaEm`;
function eventos(resultado: { results?: unknown[] }): Notificacao[] {
    return ((resultado.results || []) as Notificacao[]).map(item => ({
        ...item, destino: origemNotificacao(item.destino).caminho,
    }));
}
/** As condições e o XP vêm do banco; a identidade vem exclusivamente da sessão. */
export async function listarNotificacoes(db: Db, usuario: Usuario): Promise<Notificacao[]> {
    const agora = Date.now(), id = usuario.id;
    const resultado = await loteAtomico(db, [
        sql`insert or ignore into notificacoes(id,usuario_id,evento,tipo,titulo,descricao,destino,criado_em)
            select lower(hex(randomblob(16))),${id},evento,'conquista',titulo,descricao,destino,${agora} from (
                select 'boas-vindas' evento,'Sua jornada começa' titulo,'Você agora faz parte do universo Yokira.' descricao,'/?p=perfil' destino
                where exists(select 1 from usuarios where id=${id})
                union all select 'primeira-publicacao','Sua voz na comunidade','Você compartilhou sua primeira publicação.',
                    (select '/?p='||(case when tipo='lista' then 'listas' else 'forum' end)||'&post='||id
                    from publicacoes where autor_id=${id} and oculto=0 order by criado_em,id limit 1)
                where exists(select 1 from publicacoes where autor_id=${id} and oculto=0)
                union all select 'primeiro-jogo','Primeiro desafio','Você começou sua jornada nos jogos Yokira.',
                    '/?p=jogos&modo='||(select modo from jogos where usuario_id=${id} order by criado_em,id limit 1)
                where exists(select 1 from jogos where usuario_id=${id})
                union all select 'primeira-colecao','Uma coleção só sua','Você salvou o primeiro título na sua lista.',
                    '/?p=listas&editar='||(select titulo_id from lista where usuario_id=${id} order by criado_em,titulo_id limit 1)
                where exists(select 1 from lista where usuario_id=${id})
            )`,
        sql`with recursive niveis(n,limite) as (
                select 2,cast(max(0,xp)/100 as integer)+1 from usuarios where id=${id} and xp>=100
                union all select n+1,limite from niveis where n<limite
            ) insert or ignore into notificacoes(id,usuario_id,evento,tipo,titulo,descricao,destino,criado_em)
            select lower(hex(randomblob(16))),${id},'nivel:'||n,'nivel','Nível '||n||' alcançado',
                'Sua participação abriu um novo capítulo da sua jornada.','/?p=perfil',${agora} from niveis`,
        sql`select ${colunas} from notificacoes where usuario_id=${id} order by criado_em desc,rowid desc`,
    ]);
    return eventos(resultado[2]);
}
/** UPDATE RETURNING é a reivindicação: duas abas nunca recebem o mesmo evento. */
export async function verNotificacoes(db: Db, usuario: Usuario, dados: Record<string, unknown>): Promise<{ eventos: Notificacao[] }> {
    if (dados.ler !== undefined && typeof dados.ler !== 'boolean') throw new ErroApi('Leitura inválida.');
    if (dados.celebrar !== undefined && typeof dados.celebrar !== 'boolean') throw new ErroApi('Celebração inválida.');
    if (dados.ler !== true && dados.celebrar !== true) throw new ErroApi('Escolha uma ação para as notificações.');
    const ids = dados.ids;
    if (ids !== undefined && (!Array.isArray(ids) || ids.length > 200 || ids.some(id => typeof id !== 'string' || !/^[a-f0-9]{32}$/.test(id)))) {
        throw new ErroApi('Notificações inválidas.');
    }
    if (Array.isArray(ids) && ids.length === 0) return { eventos: [] };
    const filtro = ids === undefined ? sql`1=1` : sql`id in (${sql.join((ids as string[]).map(id => sql`${id}`), sql`,`)})`;
    const agora = Date.now();
    const [resultado] = await loteAtomico(db, [sql`update notificacoes set
        lida_em=case when ${dados.ler === true ? 1 : 0}=1 then coalesce(lida_em,${agora}) else lida_em end,
        celebrada_em=case when ${dados.celebrar === true ? 1 : 0}=1 then ${agora} else celebrada_em end
        where usuario_id=${usuario.id} and ${filtro}
        and (${dados.celebrar === true ? 1 : 0}=0 or celebrada_em is null) returning ${colunas}`]);
    return { eventos: eventos(resultado) };
}
