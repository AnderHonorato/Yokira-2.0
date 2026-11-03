import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { getDb } from '../../db';
import * as s from '../../db/schema';
import { catalogo } from '../catalogo';
import { situacoesColecao, type ItemColecao, type SituacaoColecao } from '../colecao';
import { dadosPublicos, type DadosJogo } from './jogos-publicos';
import { ErroApi, identificador, inteiro, nomeInicial, texto } from './validacao';
type Db = ReturnType<typeof getDb>;
type Usuario = typeof s.usuarios.$inferSelect;
const dia = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const titulos = new Map(catalogo.map(item => [item.id, item]));
function titulo(valor: unknown) { const id = identificador(valor); if (!titulos.has(id))
    throw new ErroApi('Título não encontrado.', 404); return id; }
function sorteio() { const ids = [...titulos.keys()]; return ids[crypto.getRandomValues(new Uint32Array(1))[0] % ids.length]; }
function publico(usuario: Usuario) { return { id: usuario.id, nome: usuario.nome, papel: usuario.papel, xp:usuario.xp, nivel:Math.floor(usuario.xp/100)+1 }; }
function itemColecao(item: typeof s.lista.$inferSelect): ItemColecao {
    return { tituloId: item.tituloId, situacao: item.situacao, episodiosVistos: item.episodiosVistos, nota: item.nota,
        criadoEm: new Date(item.criadoEm).toISOString(), atualizadoEm: new Date(item.atualizadoEm || item.criadoEm).toISOString() };
}
export async function contexto(request: Request) {
    const id = request.headers.get('oai-authenticated-user-id');
    if (!id || id.length > 160)
        throw new ErroApi('Entre com sua conta para continuar.', 401);
    const db = getDb();
    await db.insert(s.usuarios).values({ id, nome: nomeInicial(request.headers), criadoEm: Date.now() }).onConflictDoNothing();
    const [usuario] = await db.select().from(s.usuarios).where(eq(s.usuarios.id, id)).limit(1);
    return { db, usuario };
}
async function limitar(db: Db, usuarioId: string, janela: string, max: number) {
    const [linha] = await db.insert(s.limites).values({ usuarioId, janela, quantidade: 1 }).onConflictDoUpdate({
        target: [s.limites.usuarioId, s.limites.janela], set: { quantidade: sql `${s.limites.quantidade}+1` }, setWhere: sql `${s.limites.quantidade}<${max}`
    }).returning();
    if (!linha)
        throw new ErroApi('Limite de atividades atingido. Tente novamente mais tarde.', 429);
    return max - linha.quantidade;
}
/**
 * Leitura pública: não consulta lista, progresso, jogos ou outras informações
 * particulares. O identificador vazio impede marcar votos de outra pessoa.
 */
export async function estadoPublico() {
    const db = getDb();
    const [membros, posts, totalMembros, totalAtividades] = await Promise.all([
        db.select({ id: s.usuarios.id, nome: s.usuarios.nome, xp: s.usuarios.xp }).from(s.usuarios).orderBy(desc(s.usuarios.xp)).limit(100),
        publicacoes(db, ''),
        db.select({ total: sql<number> `count(*)` }).from(s.usuarios),
        db.select({ total: sql<number> `(select count(*) from publicacoes)+(select count(*) from respostas)+(select count(*) from jogos)` }).from(s.usuarios).limit(1)
    ]);
    return {
        estatisticas: { membros: totalMembros[0]?.total || 0, atividades: totalAtividades[0]?.total || 0 },
        membros: membros.map(m => ({ ...m, nivel: Math.floor(m.xp / 100) + 1 })),
        publicacoes: posts
    };
}
export async function estado(db: Db, usuario: Usuario) {
    const [membros, posts, minhaLista, progresso, jogos, totalMembros, totalAtividades] = await Promise.all([
        db.select({ id: s.usuarios.id, nome: s.usuarios.nome, xp: s.usuarios.xp }).from(s.usuarios).orderBy(desc(s.usuarios.xp)).limit(100),
        publicacoes(db, usuario.id),
        db.select().from(s.lista).where(eq(s.lista.usuarioId, usuario.id)).orderBy(desc(s.lista.atualizadoEm), desc(s.lista.criadoEm)).limit(200),
        db.select({ tituloId: s.progresso.tituloId, segundos: s.progresso.segundos }).from(s.progresso).where(eq(s.progresso.usuarioId, usuario.id)).limit(200),
        db.select().from(s.jogos).where(eq(s.jogos.usuarioId, usuario.id)).orderBy(desc(s.jogos.atualizadoEm)).limit(30),
        db.select({ total: sql<number> `count(*)` }).from(s.usuarios),
        db.select({ total: sql<number> `(select count(*) from publicacoes)+(select count(*) from respostas)+(select count(*) from jogos)` }).from(s.usuarios).limit(1)
    ]);
    return { usuario: publico(usuario), estatisticas: { membros: totalMembros[0]?.total || 0, atividades: totalAtividades[0]?.total || 0 }, membros: membros.map(m => ({ ...m, nivel: Math.floor(m.xp / 100) + 1 })), publicacoes: posts, minhaLista: minhaLista.map(t => t.tituloId), colecao: minhaLista.map(itemColecao), progresso, jogos: jogos.map(j => jogoPublico(j)) };
}
export async function publicacoes(db: Db, usuarioId: string, id?: string) {
    const posts = await db.select({ id: s.publicacoes.id, tipo: s.publicacoes.tipo, titulo: s.publicacoes.titulo, corpo: s.publicacoes.corpo, criadoEm: s.publicacoes.criadoEm, autor: { id: s.usuarios.id, nome: s.usuarios.nome } }).from(s.publicacoes).innerJoin(s.usuarios, eq(s.usuarios.id, s.publicacoes.autorId)).where(id ? eq(s.publicacoes.id, id) : undefined).orderBy(desc(s.publicacoes.criadoEm)).limit(id ? 1 : 50);
    if (!posts.length)
        return [];
    const ids = posts.map(p => p.id);
    const [opcoes, votos, contagens, respostas] = await Promise.all([
        db.select().from(s.opcoes).where(inArray(s.opcoes.publicacaoId, ids)),
        db.select({ publicacaoId: s.votos.publicacaoId, tituloId: s.votos.tituloId, total: sql<number> `count(*)`, meuVoto: sql<number> `max(case when ${s.votos.usuarioId}=${usuarioId} then 1 else 0 end)` }).from(s.votos).where(inArray(s.votos.publicacaoId, ids)).groupBy(s.votos.publicacaoId, s.votos.tituloId),
        db.select({ publicacaoId: s.respostas.publicacaoId, total: sql<number> `count(*)` }).from(s.respostas).where(inArray(s.respostas.publicacaoId, ids)).groupBy(s.respostas.publicacaoId),
        id ? db.select({ id: s.respostas.id, publicacaoId: s.respostas.publicacaoId, corpo: s.respostas.corpo, criadoEm: s.respostas.criadoEm, autor: { id: s.usuarios.id, nome: s.usuarios.nome } }).from(s.respostas).innerJoin(s.usuarios, eq(s.usuarios.id, s.respostas.autorId)).where(eq(s.respostas.publicacaoId, id)).orderBy(desc(s.respostas.criadoEm)).limit(200) : Promise.resolve([])
    ]);
    return posts.map(p => ({ ...p, criadoEm: new Date(p.criadoEm).toISOString(), respostas: contagens.find(r => r.publicacaoId === p.id)?.total || 0, votos: votos.filter(v => v.publicacaoId === p.id).reduce((total, v) => total + v.total, 0), opcoes: opcoes.filter(o => o.publicacaoId === p.id).map(o => { const voto = votos.find(v => v.publicacaoId === p.id && v.tituloId === o.tituloId); return { tituloId: o.tituloId, votos: voto?.total || 0, meuVoto: !!voto?.meuVoto }; }), ...(id ? { comentarios: respostas.map(r => ({ ...r, criadoEm: new Date(r.criadoEm).toISOString() })) } : {}) }));
}
export async function mutar(db: Db, usuario: Usuario, p: Record<string, unknown>) {
    const acao = texto(p.acao, 'Ação', 1, 30);
    const agora = Date.now();
    await limitar(db, usuario.id, `minuto:${Math.floor(agora / 60000)}`, 60);
    if (acao === 'lista') {
        const tituloId = titulo(p.tituloId);
        if (p.adicionado !== undefined && typeof p.adicionado !== 'boolean')
            throw new ErroApi('Escolha se o título deve ser adicionado ou removido.');
        const cond = and(eq(s.lista.usuarioId, usuario.id), eq(s.lista.tituloId, tituloId));
        if (p.adicionado !== true) {
            const removidos = await db.delete(s.lista).where(cond).returning();
            if (removidos.length || p.adicionado === false)
                return { ok: true, adicionado: false };
        }
        await db.insert(s.lista).values({ usuarioId: usuario.id, tituloId, criadoEm: agora, atualizadoEm: agora }).onConflictDoNothing();
        return { ok: true, adicionado: true };
    }
    if (acao === 'acompanhamento') {
        const tituloId = titulo(p.tituloId), meta = titulos.get(tituloId)!;
        if (typeof p.situacao !== 'string' || !situacoesColecao.includes(p.situacao as SituacaoColecao))
            throw new ErroApi('Situação de acompanhamento inválida.');
        const situacao = p.situacao as SituacaoColecao;
        const informado = inteiro(p.episodiosVistos, 'Episódios vistos', 0, meta.episodios || 100000);
        const episodiosVistos = situacao === 'concluido' && meta.episodios > 0 ? meta.episodios : informado;
        const nota = p.nota === null ? null : inteiro(p.nota, 'Nota', 1, 10);
        const [item] = await db.insert(s.lista).values({ usuarioId: usuario.id, tituloId, situacao, episodiosVistos, nota, criadoEm: agora, atualizadoEm: agora })
            .onConflictDoUpdate({ target: [s.lista.usuarioId, s.lista.tituloId], set: { situacao, episodiosVistos, nota, atualizadoEm: agora } }).returning();
        return { ok: true, item: itemColecao(item) };
    }
    if (acao === 'progresso') {
        const tituloId = p.tituloId === 'demonstracao' ? 'demonstracao' : titulo(p.tituloId);
        const segundos = inteiro(p.segundos, 'Progresso', 0, 86400);
        await db.insert(s.progresso).values({ usuarioId: usuario.id, tituloId, segundos, atualizadoEm: agora }).onConflictDoUpdate({ target: [s.progresso.usuarioId, s.progresso.tituloId], set: { segundos, atualizadoEm: agora } });
        return { ok: true };
    }
    if (acao === 'perfil') {
        const nome = texto(p.nome, 'Nome', 2, 60);
        await db.update(s.usuarios).set({ nome }).where(eq(s.usuarios.id, usuario.id));
        return { ok: true, usuario: { ...publico(usuario), nome } };
    }
    if (acao === 'publicar') {
        const tipo = texto(p.tipo, 'Tipo', 1, 20);
        if (!['forum', 'editorial', 'lista'].includes(tipo))
            throw new ErroApi('Tipo inválido.');
        if (tipo === 'editorial' && usuario.papel !== 'editor')
            throw new ErroApi('Apenas a equipe editorial pode publicar editoriais.', 403);
        const tituloTexto = texto(p.titulo, 'Título', 3, 160), corpo = texto(p.corpo, 'Conteúdo', 3, 10000);
        let tituloIds: string[] = [];
        if (tipo === 'lista') {
            if (!Array.isArray(p.tituloIds) || p.tituloIds.length < 2 || p.tituloIds.length > 20)
                throw new ErroApi('Escolha entre 2 e 20 títulos.');
            tituloIds = [...new Set(p.tituloIds.map(titulo))];
            if (tituloIds.length < 2)
                throw new ErroApi('Escolha títulos diferentes.');
        }
        await limitar(db, usuario.id, `publicar:${dia()}`, 20);
        const id = crypto.randomUUID();
        const ins = db.insert(s.publicacoes).values({ id, autorId: usuario.id, tipo, titulo: tituloTexto, corpo, criadoEm: agora });
        if (tituloIds.length)
            await db.batch([ins, db.insert(s.opcoes).values(tituloIds.map(tituloId => ({ publicacaoId: id, tituloId }))), db.update(s.usuarios).set({ xp: sql `${s.usuarios.xp}+10` }).where(eq(s.usuarios.id, usuario.id))]);
        else
            await db.batch([ins, db.update(s.usuarios).set({ xp: sql `${s.usuarios.xp}+10` }).where(eq(s.usuarios.id, usuario.id))]);
        return { ok: true, id };
    }
    if (acao === 'responder') {
        const publicacaoId = identificador(p.publicacaoId), corpo = texto(p.corpo, 'Resposta', 1, 4000);
        const [post] = await db.select({ id: s.publicacoes.id }).from(s.publicacoes).where(eq(s.publicacoes.id, publicacaoId)).limit(1);
        if (!post)
            throw new ErroApi('Publicação não encontrada.', 404);
        await limitar(db, usuario.id, `responder:${dia()}`, 100);
        const id = crypto.randomUUID();
        await db.batch([db.insert(s.respostas).values({ id, publicacaoId, autorId: usuario.id, corpo, criadoEm: agora }), db.update(s.usuarios).set({ xp: sql `${s.usuarios.xp}+2` }).where(eq(s.usuarios.id, usuario.id))]);
        return { ok: true, id };
    }
    if (acao === 'votar') {
        const publicacaoId = identificador(p.publicacaoId), tituloId = titulo(p.tituloId);
        const [opcao] = await db.select().from(s.opcoes).where(and(eq(s.opcoes.publicacaoId, publicacaoId), eq(s.opcoes.tituloId, tituloId))).limit(1);
        if (!opcao)
            throw new ErroApi('Opção de voto inválida.');
        await db.insert(s.votos).values({ publicacaoId, usuarioId: usuario.id, tituloId }).onConflictDoUpdate({ target: [s.votos.publicacaoId, s.votos.usuarioId], set: { tituloId } });
        return { ok: true, tituloId };
    }
    if (acao === 'jogo')
        return jogar(db, usuario, p);
    throw new ErroApi('Ação desconhecida.');
}
function jogoPublico(jogo: typeof s.jogos.$inferSelect) { return dadosPublicos(jogo, id => titulos.get(id)?.sinopse); }
async function jogar(db: Db, usuario: Usuario, p: Record<string, unknown>) {
    const modo = texto(p.modo, 'Modo', 1, 20), agora = Date.now();
    if (modo === 'adivinhe') {
        const id = `${usuario.id}:adivinhe:${dia()}`;
        let [jogo] = await db.select().from(s.jogos).where(and(eq(s.jogos.id, id), eq(s.jogos.usuarioId, usuario.id))).limit(1);
        if (!jogo) {
            const respostaId = sorteio(), meta = titulos.get(respostaId)!;
            const dados: DadosJogo = { respostaId, tentativas: [], concluido: false, ganhou: false, limite: 6, dica: { ano: meta.ano, generos: meta.generos, tipo: meta.tipo } };
            await db.insert(s.jogos).values({ id, usuarioId: usuario.id, modo, dados: JSON.stringify(dados), criadoEm: agora, atualizadoEm: agora }).onConflictDoNothing();
            [jogo] = await db.select().from(s.jogos).where(eq(s.jogos.id, id)).limit(1);
        }
        if (p.tituloId !== undefined) {
            const palpite = titulo(p.tituloId), dados = JSON.parse(jogo.dados) as DadosJogo;
            if (dados.concluido)
                return { ok: true, jogo: jogoPublico(jogo) };
            if (dados.tentativas!.some(t => t.tituloId === palpite))
                return { ok: true, jogo: jogoPublico(jogo) };
            const acertou = palpite === dados.respostaId;
            dados.tentativas!.push({ tituloId: palpite, acertou });
            dados.ganhou = acertou;
            dados.concluido = acertou || dados.tentativas!.length >= 6;
            const novo = JSON.stringify(dados);
            const alterados = await db.update(s.jogos).set({ dados: novo, atualizadoEm: agora }).where(and(eq(s.jogos.id, id), eq(s.jogos.dados, jogo.dados))).returning();
            if (!alterados.length)
                throw new ErroApi('O jogo mudou em outra aba. Atualize e tente novamente.', 409);
            jogo = alterados[0];
        }
        return { ok: true, jogo: jogoPublico(jogo) };
    }
    if (modo === 'quiz' || modo === 'torneio') {
        const id = `${usuario.id}:${modo}:${dia()}`;
        let [jogo] = await db.select().from(s.jogos).where(and(eq(s.jogos.id, id), eq(s.jogos.usuarioId, usuario.id))).limit(1);
        if (!jogo) {
            const embaralhar = (ids: string[]) => { const copia = [...ids]; for (let i = copia.length - 1; i > 0; i--) {
                const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
                [copia[i], copia[j]] = [copia[j], copia[i]];
            } return copia; };
            const ids = embaralhar([...titulos.keys()]);
            let dados: DadosJogo;
            if (modo === 'quiz')
                dados = { indice: 0, pontos: 0, versao: 0, concluido: false, questoes: ids.slice(0, 5).map(respostaId => ({ respostaId, opcoes: embaralhar([respostaId, ...embaralhar(ids.filter(id => id !== respostaId)).slice(0, 3)]) })) };
            else
                dados = { fila: ids.slice(0, 8), proxima: [], rodada: 1, versao: 0, concluido: false };
            await db.insert(s.jogos).values({ id, usuarioId: usuario.id, modo, dados: JSON.stringify(dados), criadoEm: agora, atualizadoEm: agora }).onConflictDoNothing();
            [jogo] = await db.select().from(s.jogos).where(eq(s.jogos.id, id)).limit(1);
        }
        if (p.tituloId !== undefined) {
            const escolhido = titulo(p.tituloId), dados = JSON.parse(jogo.dados) as DadosJogo;
            if (dados.concluido)
                return { ok: true, jogo: jogoPublico(jogo) };
            if (p.versao !== undefined && inteiro(p.versao, 'Versão', 0, 100) !== dados.versao)
                throw new ErroApi('O jogo mudou. Atualize e tente novamente.', 409);
            if (modo === 'quiz') {
                const questao = dados.questoes![dados.indice!];
                if (!questao.opcoes.includes(escolhido))
                    throw new ErroApi('Escolha uma opção desta pergunta.');
                const acertou = escolhido === questao.respostaId;
                dados.ultima = { acertou, respostaId: questao.respostaId };
                dados.pontos! += Number(acertou);
                dados.indice!++;
                dados.concluido = dados.indice! >= dados.questoes!.length;
            }
            else {
                if (!dados.fila!.slice(0, 2).includes(escolhido))
                    throw new ErroApi('Escolha um título do confronto atual.');
                dados.fila = dados.fila!.slice(2);
                dados.proxima!.push(escolhido);
                if (!dados.fila.length) {
                    if (dados.proxima!.length === 1) {
                        dados.campeaoId = dados.proxima![0];
                        dados.concluido = true;
                    }
                    else {
                        dados.fila = dados.proxima;
                        dados.proxima = [];
                        dados.rodada!++;
                    }
                }
            }
            dados.versao!++;
            const alterados = await db.update(s.jogos).set({ dados: JSON.stringify(dados), atualizadoEm: agora }).where(and(eq(s.jogos.id, id), eq(s.jogos.dados, jogo.dados))).returning();
            if (!alterados.length)
                throw new ErroApi('O jogo mudou em outra aba. Atualize e tente novamente.', 409);
            jogo = alterados[0];
        }
        return { ok: true, jogo: jogoPublico(jogo) };
    }
    if (modo === 'gacha') {
        const restantes = await limitar(db, usuario.id, `gacha:${dia()}`, 3), tituloId = sorteio(), id = crypto.randomUUID();
        const dados = { tituloId, restantes };
        await db.insert(s.jogos).values({ id, usuarioId: usuario.id, modo, dados: JSON.stringify(dados), criadoEm: agora, atualizadoEm: agora });
        return { ok: true, jogo: { id, modo, ...dados } };
    }
    if (modo === 'duelo') {
        const vencedorId = titulo(p.tituloId), perdedorId = titulo(p.adversarioId);
        if (vencedorId === perdedorId)
            throw new ErroApi('Escolha dois títulos diferentes.');
        const restantes = await limitar(db, usuario.id, `duelo:${dia()}`, 20), id = crypto.randomUUID(), dados = { vencedorId, perdedorId, restantes };
        await db.insert(s.jogos).values({ id, usuarioId: usuario.id, modo, dados: JSON.stringify(dados), criadoEm: agora, atualizadoEm: agora });
        return { ok: true, jogo: { id, modo, ...dados } };
    }
    if (modo === 'tier') {
        if (!p.tiers || typeof p.tiers !== 'object' || Array.isArray(p.tiers))
            throw new ErroApi('Ranking inválido.');
        const entrada = p.tiers as Record<string, unknown>, tiers: Record<string, string[]> = {}, vistos = new Set<string>();
        if (Object.keys(entrada).some(k => !['S', 'A', 'B', 'C', 'D'].includes(k)))
            throw new ErroApi('Faixa inválida.');
        for (const faixa of ['S', 'A', 'B', 'C', 'D']) {
            const itens = entrada[faixa] ?? [];
            if (!Array.isArray(itens) || itens.length > 100)
                throw new ErroApi('Ranking inválido.');
            tiers[faixa] = itens.map(titulo);
            for (const item of tiers[faixa]) {
                if (vistos.has(item))
                    throw new ErroApi('Título repetido no ranking.');
                vistos.add(item);
            }
        }
        if (vistos.size > 100)
            throw new ErroApi('Use até 100 títulos.');
        const id = crypto.randomUUID(), dados = JSON.stringify({ tiers });
        await limitar(db, usuario.id, `tier:${dia()}`, 30);
        await db.insert(s.jogos).values({ id, usuarioId: usuario.id, modo, dados, criadoEm: agora, atualizadoEm: agora });
        return { ok: true, jogo: { id, modo, tiers } };
    }
    throw new ErroApi('Modo de jogo indisponível.');
}
export async function obterTier(db: Db, id: string) { const [jogo] = await db.select().from(s.jogos).where(and(eq(s.jogos.id, id), eq(s.jogos.modo, 'tier'))).limit(1); if (!jogo)
    throw new ErroApi('Tier list não encontrada.', 404); return { id: jogo.id, tiers: (JSON.parse(jogo.dados) as DadosJogo).tiers }; }
