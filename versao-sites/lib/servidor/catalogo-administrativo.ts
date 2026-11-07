import { sql } from 'drizzle-orm';
import { catalogo, editoriais, type Anime, type Editorial } from '../catalogo';
import { equipeAtiva, loteAtomico, type Db, type Usuario } from './permissoes';
import { ErroApi } from './validacao';
import { validarAlteracaoAcervo } from './validacao-acervo';

export type TituloAdministrativo = Anime & { oculto: boolean };
export type EditorialAdministrativo = Editorial & { oculto: boolean };
type Sobreposicao = { tipo: 'titulo' | 'editorial'; alvo_id: string; dados: string; oculto: number };
export async function obterAcervo(db: Db, incluirOcultos = false): Promise<{ catalogo: TituloAdministrativo[]; editoriais: EditorialAdministrativo[] }> {
    const [sobreposicoes, disponibilidade] = await Promise.all([
        db.all<Sobreposicao>(sql`select tipo,alvo_id,dados,oculto from sobreposicoes_conteudo`),
        db.all<{ titulo_id: string; oculto: number }>(sql`select titulo_id,oculto from catalogo_disponibilidade`)
    ]);
    const titulosOcultos = new Map(disponibilidade.map(item => [item.titulo_id, !!item.oculto]));
    const titulos = new Map<string, TituloAdministrativo>(catalogo.map(item => [item.id, { ...item, oculto: titulosOcultos.get(item.id) ?? false }]));
    const textos = new Map<string, EditorialAdministrativo>(editoriais.map(item => [item.id, { ...item, oculto: false }]));
    for (const item of sobreposicoes) {
        // A mesma validação da escrita mantém os dados persistidos dentro do contrato.
        const validado = validarAlteracaoAcervo({ tipo: item.tipo, alvoId: item.alvo_id, dados: JSON.parse(item.dados), oculto: !!item.oculto, motivo: 'Leitura do acervo' });
        if (validado.tipo === 'titulo') titulos.set(item.alvo_id, { ...validado.dados, id: item.alvo_id, oculto: titulosOcultos.get(item.alvo_id) ?? false });
        else if (textos.has(item.alvo_id)) textos.set(item.alvo_id, { ...validado.dados, id: item.alvo_id, oculto: !!item.oculto });
    }
    return { catalogo: [...titulos.values()].filter(item => incluirOcultos || !item.oculto),
        editoriais: [...textos.values()].filter(item => incluirOcultos || !item.oculto) };
}
export async function salvarAcervo(db: Db, usuario: Usuario, payload: Record<string, unknown>) {
    if (usuario.suspenso || usuario.papel !== 'administrador') throw new ErroApi('Somente administradores ativos podem editar o acervo.', 403);
    const p = validarAlteracaoAcervo(payload);
    const atual = await obterAcervo(db, true);
    const base = p.tipo === 'titulo' ? atual.catalogo : atual.editoriais;
    if (p.alvoId && !base.some(item => item.id === p.alvoId)) throw new ErroApi('Conteúdo não encontrado.', 404);
    if (p.tipo === 'titulo' && atual.catalogo.some(item => item.id !== p.alvoId && item.slug === p.dados.slug))
        throw new ErroApi('Este slug já pertence a outro título.', 409);
    const id = p.alvoId ?? crypto.randomUUID();
    const alterar = sql`insert into sobreposicoes_conteudo(tipo,alvo_id,dados,oculto)
        select ${p.tipo},${id},${JSON.stringify(p.dados)},${p.oculto ? 1 : 0} where ${equipeAtiva(usuario.id, true)}
        on conflict(tipo,alvo_id) do update set dados=excluded.dados,oculto=excluded.oculto returning alvo_id as id`;
    const auditar = sql`insert into registros_moderacao(id,autor_id,acao,alvo_tipo,alvo_id,motivo,criado_em)
        select ${crypto.randomUUID()},${usuario.id},'salvar-acervo',${p.tipo},${id},${p.motivo},${Date.now()} where changes()>0`;
    const disponibilidade = sql`insert into catalogo_disponibilidade(titulo_id,oculto)
        select ${id},${p.oculto ? 1 : 0} where ${equipeAtiva(usuario.id, true)}
        on conflict(titulo_id) do update set oculto=excluded.oculto`;
    try {
        const [alterados] = await loteAtomico(db, p.tipo === 'titulo' ? [alterar, auditar, disponibilidade] : [alterar, auditar]);
        if (!alterados.results.length) throw new ErroApi('Sua permissão de administrador não está mais ativa.', 403);
        return { ok: true, id };
    } catch (erro) {
        let causa: unknown = erro;
        for (let i = 0; causa instanceof Error && i < 5; i++, causa = causa.cause) {
            if (causa.message.includes('sobreposicoes_slug_unico')) throw new ErroApi('Este slug já pertence a outro título.', 409);
        }
        throw erro;
    }
}
