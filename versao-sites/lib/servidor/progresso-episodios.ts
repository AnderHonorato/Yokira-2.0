import { eq, and } from 'drizzle-orm';
import * as s from '../../db/schema';
import { exigirAtivo, type Db, type Usuario } from './permissoes';
import { obterEpisodiosPublicos } from './temporadas';
import { ErroApi, identificador, inteiro } from './validacao';

export async function salvarProgressoEpisodio(db: Db, usuario: Usuario, dados: Record<string, unknown>) {
    exigirAtivo(usuario);
    const tituloId = identificador(dados.tituloId), episodioId = identificador(dados.episodioId);
    const { episodios } = await obterEpisodiosPublicos(db, tituloId);
    if (!episodios.some(episodio => episodio.id === episodioId)) throw new ErroApi('Episódio indisponível.', 404);
    const segundos = inteiro(dados.segundos, 'Progresso', 0, 86400);
    const tituloChave = `episodio:${episodioId}`;
    await db.insert(s.progresso).values({usuarioId: usuario.id, tituloId: tituloChave, segundos, atualizadoEm: Date.now()})
        .onConflictDoUpdate({target: [s.progresso.usuarioId, s.progresso.tituloId], set: {segundos, atualizadoEm: Date.now()}});
    return {ok: true};
}

export async function obterProgressoEpisodio(db: Db, usuario: Usuario, episodioId: string) {
    const [progresso] = await db.select({segundos: s.progresso.segundos}).from(s.progresso)
        .where(and(eq(s.progresso.usuarioId, usuario.id), eq(s.progresso.tituloId, `episodio:${episodioId}`))).limit(1);
    return progresso?.segundos || 0;
}
