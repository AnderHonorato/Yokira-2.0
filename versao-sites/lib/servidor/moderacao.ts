import { desc, eq, getTableColumns, like, or, sql, type SQL } from 'drizzle-orm';
import { obterAcervo } from './catalogo-administrativo';
import * as s from '../../db/schema';
import { equipeAtiva, exigirModeracao, loteAtomico, papeis, type Db, type Usuario } from './permissoes';
import { ErroApi, identificador, texto } from './validacao';

function booleano(valor: unknown): boolean {
    if (typeof valor !== 'boolean') throw new ErroApi('Informe uma opção válida.');
    return valor;
}
function tipoAlvo(valor: unknown): 'publicacao' | 'resposta' {
    if (valor !== 'publicacao' && valor !== 'resposta') throw new ErroApi('Tipo de conteúdo inválido.');
    return valor;
}
function auditoria(usuario: Usuario, acao: string, tipo: string, alvo: string, motivo: string) {
    return sql`insert into registros_moderacao(id,autor_id,acao,alvo_tipo,alvo_id,motivo,criado_em)
        select ${crypto.randomUUID()},${usuario.id},${acao},${tipo},${alvo},${motivo},${Date.now()} where changes()>0`;
}
async function executar(db: Db, usuario: Usuario, comando: SQL, acao: string, tipo: string, alvo: string, motivo: string) {
    try {
        const [alterados] = await loteAtomico(db, [comando, auditoria(usuario, acao, tipo, alvo, motivo)]);
        if (!alterados.results.length) throw new ErroApi('Ação não permitida ou registro indisponível.', 403);
        return { ok: true };
    } catch (erro) {
        let causa: unknown = erro;
        for (let i = 0; causa instanceof Error && i < 5; i++, causa = causa.cause) {
            if (causa.message.includes('ultimo_administrador')) throw new ErroApi('Não é possível remover o último administrador ativo.', 409);
        }
        throw erro;
    }
}
export async function listarModeracao(db: Db, usuario: Usuario, busca = '') {
    exigirModeracao(usuario);
    const pesquisa = busca.trim().slice(0, 80).replace(/[\\%_]/g, '');
    const [usuarios, publicacoes, respostas, denuncias, registros, acervo] = await Promise.all([
        db.select().from(s.usuarios).where(pesquisa ? or(like(s.usuarios.nome, `%${pesquisa}%`), like(s.usuarios.id, `%${pesquisa}%`)) : undefined).orderBy(desc(s.usuarios.criadoEm)).limit(100),
        db.select({ id: s.publicacoes.id, titulo: s.publicacoes.titulo, tipo: s.publicacoes.tipo, corpo: s.publicacoes.corpo, autorId: s.publicacoes.autorId, autorNome: s.usuarios.nome, oculto: s.publicacoes.oculto, criadoEm: s.publicacoes.criadoEm }).from(s.publicacoes).innerJoin(s.usuarios, eq(s.usuarios.id, s.publicacoes.autorId)).where(pesquisa ? or(like(s.publicacoes.titulo, `%${pesquisa}%`), like(s.publicacoes.corpo, `%${pesquisa}%`), like(s.usuarios.nome, `%${pesquisa}%`)) : undefined).orderBy(desc(s.publicacoes.criadoEm)).limit(100),
        db.select({ id: s.respostas.id, publicacaoId: s.respostas.publicacaoId, corpo: s.respostas.corpo, autorId: s.respostas.autorId, autorNome: s.usuarios.nome, oculto: s.respostas.oculto, criadoEm: s.respostas.criadoEm }).from(s.respostas).innerJoin(s.usuarios, eq(s.usuarios.id, s.respostas.autorId)).where(pesquisa ? or(like(s.respostas.corpo, `%${pesquisa}%`), like(s.usuarios.nome, `%${pesquisa}%`)) : undefined).orderBy(desc(s.respostas.criadoEm)).limit(100),
        db.select({ ...getTableColumns(s.denuncias),
            alvoTitulo: sql<string | null>`case when ${s.denuncias.alvoTipo}='publicacao' then ${s.publicacoes.titulo} else (select titulo from publicacoes where id=${s.respostas.publicacaoId}) end`,
            alvoCorpo: sql<string | null>`case when ${s.denuncias.alvoTipo}='publicacao' then ${s.publicacoes.corpo} else ${s.respostas.corpo} end`,
            alvoOculto: sql`case when ${s.denuncias.alvoTipo}='publicacao' then ${s.publicacoes.oculto} else ${s.respostas.oculto} end`.mapWith(Boolean)
        }).from(s.denuncias).leftJoin(s.publicacoes, eq(s.publicacoes.id, s.denuncias.alvoId)).leftJoin(s.respostas, eq(s.respostas.id, s.denuncias.alvoId)).where(pesquisa ? or(like(s.denuncias.motivo, `%${pesquisa}%`), like(s.denuncias.alvoId, `%${pesquisa}%`)) : undefined).orderBy(s.denuncias.resolvida, desc(s.denuncias.criadoEm)).limit(100),
        db.select().from(s.registros).where(pesquisa ? or(like(s.registros.motivo, `%${pesquisa}%`), like(s.registros.acao, `%${pesquisa}%`), like(s.registros.alvoId, `%${pesquisa}%`)) : undefined).orderBy(desc(s.registros.criadoEm)).limit(100),
        obterAcervo(db, true)
    ]);
    const catalogo = acervo.catalogo;
    return { usuarios, publicacoes, respostas, denuncias, registros,
        catalogo: catalogo.filter(item => !pesquisa || item.nome.toLowerCase().includes(pesquisa.toLowerCase())).map(item => ({ id: item.id, nome: item.nome, oculto: item.oculto })) };
}
export async function denunciar(db: Db, usuario: Usuario, p: Record<string, unknown>) {
    const tipo = tipoAlvo(p.alvoTipo), alvo = identificador(p.alvoId), motivo = texto(p.motivo, 'Motivo', 3, 500);
    const visivel = tipo === 'publicacao'
        ? sql`exists (select 1 from publicacoes where id=${alvo} and oculto=0)`
        : sql`exists (select 1 from respostas r inner join publicacoes p on p.id=r.publicacao_id where r.id=${alvo} and r.oculto=0 and p.oculto=0)`;
    const [criado] = await loteAtomico(db, [
        sql`insert into denuncias(id,autor_id,alvo_tipo,alvo_id,motivo,criado_em)
            select ${crypto.randomUUID()},${usuario.id},${tipo},${alvo},${motivo},${Date.now()}
            where ${visivel} and exists(select 1 from usuarios where id=${usuario.id} and suspenso=0)
            on conflict(autor_id,alvo_tipo,alvo_id) do update set motivo=excluded.motivo,resolvida=0 returning id`
    ]);
    if (!criado.results.length) throw new ErroApi('Conteúdo indisponível.', 404);
    return { ok: true };
}
export async function moderar(db: Db, usuario: Usuario, p: Record<string, unknown>) {
    exigirModeracao(usuario);
    const acao = String(p.acao), motivo = texto(p.motivo, 'Motivo', 3, 500);
    if (acao === 'editar-usuario') {
        const alvo = identificador(p.usuarioId), nome = texto(p.nome, 'Nome', 2, 60);
        return executar(db, usuario, sql`update usuarios set nome=${nome} where id=${alvo}
            and ${equipeAtiva(usuario.id, true)} returning id`, acao, 'usuario', alvo, motivo);
    }
    if (acao === 'editar-conteudo') {
        const tipo = tipoAlvo(p.alvoTipo), alvo = identificador(p.alvoId);
        const corpo = texto(p.corpo, 'Conteúdo', tipo === 'publicacao' ? 3 : 1, tipo === 'publicacao' ? 10000 : 4000);
        const comando = tipo === 'publicacao'
            ? sql`update publicacoes set titulo=${texto(p.titulo, 'Título', 3, 160)},corpo=${corpo} where id=${alvo} and ${equipeAtiva(usuario.id, true)} returning id`
            : sql`update respostas set corpo=${corpo} where id=${alvo} and ${equipeAtiva(usuario.id, true)} returning id`;
        return executar(db, usuario, comando, acao, tipo, alvo, motivo);
    }
    if (acao === 'moderar-catalogo') {
        const alvo = identificador(p.tituloId), oculto = booleano(p.oculto);
        if (!(await obterAcervo(db, true)).catalogo.some(item => item.id === alvo)) throw new ErroApi('Título não encontrado.', 404);
        return executar(db, usuario, sql`insert into catalogo_disponibilidade(titulo_id,oculto)
            select ${alvo},${oculto ? 1 : 0} where ${equipeAtiva(usuario.id)}
            on conflict(titulo_id) do update set oculto=excluded.oculto returning titulo_id as id`,
            acao, 'catalogo', alvo, `${oculto ? 'Ocultar' : 'Restaurar'}: ${motivo}`);
    }
    if (acao === 'suspender-usuario') {
        const alvo = identificador(p.usuarioId), suspenso = booleano(p.suspenso);
        if (alvo === usuario.id) throw new ErroApi('Você não pode suspender a própria conta.', 403);
        return executar(db, usuario, sql`update usuarios set suspenso=${suspenso ? 1 : 0}
            where id=${alvo} and ${equipeAtiva(usuario.id)} and
            (papel in ('membro','editor') or ${equipeAtiva(usuario.id, true)}) returning id`, acao, 'usuario', alvo, `${suspenso ? 'Suspender' : 'Reativar'}: ${motivo}`);
    }
    if (acao === 'alterar-papel') {
        const alvo = identificador(p.usuarioId);
        if (!papeis.includes(p.papel as typeof papeis[number])) throw new ErroApi('Papel inválido.');
        return executar(db, usuario, sql`update usuarios set papel=${String(p.papel)} where id=${alvo}
            and ${equipeAtiva(usuario.id, true)} returning id`, acao, 'usuario', alvo, `${String(p.papel)}: ${motivo}`);
    }
    if (acao === 'moderar-conteudo') {
        const tipo = tipoAlvo(p.alvoTipo), alvo = identificador(p.alvoId), oculto = booleano(p.oculto);
        const tabela = tipo === 'publicacao' ? sql`publicacoes` : sql`respostas`;
        return executar(db, usuario, sql`update ${tabela} set oculto=${oculto ? 1 : 0} where id=${alvo}
            and ${equipeAtiva(usuario.id)} returning id`, acao, tipo, alvo, `${oculto ? 'Ocultar' : 'Restaurar'}: ${motivo}`);
    }
    if (acao === 'resolver-denuncia') {
        const alvo = identificador(p.denunciaId), resolvida = booleano(p.resolvida);
        return executar(db, usuario, sql`update denuncias set resolvida=${resolvida ? 1 : 0} where id=${alvo}
            and ${equipeAtiva(usuario.id)} returning id`, acao, 'denuncia', alvo, `${resolvida ? 'Resolver' : 'Reabrir'}: ${motivo}`);
    }
    throw new ErroApi('Ação desconhecida.');
}

export async function titulosOcultos(db: Db): Promise<string[]> {
    const linhas = await db.select({ id: s.disponibilidadeCatalogo.tituloId }).from(s.disponibilidadeCatalogo).where(eq(s.disponibilidadeCatalogo.oculto, true));
    return linhas.map(item => item.id);
}
export async function exigirTituloDisponivel(db: Db, tituloId: string): Promise<void> {
    const [item] = await db.select().from(s.disponibilidadeCatalogo).where(eq(s.disponibilidadeCatalogo.tituloId, tituloId)).limit(1);
    if (item?.oculto) throw new ErroApi('Título indisponível.', 404);
}
