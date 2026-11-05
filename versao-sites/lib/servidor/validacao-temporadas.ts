import { ErroApi, identificador, inteiro, texto } from './validacao';
import { enderecoMidia } from './validacao-acervo';

function booleano(valor: unknown, nome: string, padrao = false): boolean {
    if (valor === undefined) return padrao;
    if (typeof valor !== 'boolean') throw new ErroApi(`${nome} inválido.`);
    return valor;
}
function idOpcional(valor: unknown): string | undefined { return valor === undefined || valor === '' ? undefined : identificador(valor); }
export function validarTemporada(p: Record<string, unknown>) {
    return { id: idOpcional(p.id), tituloId: identificador(p.tituloId), numero: inteiro(p.numero, 'Número da temporada', 1, 10000),
        nome: texto(p.nome, 'Nome da temporada', 1, 200), ordem: inteiro(p.ordem ?? p.numero, 'Ordem', 1, 100000),
        arquivado: booleano(p.arquivado, 'Arquivamento'), motivo: texto(p.motivo, 'Motivo', 3, 500) };
}
export function validarEpisodio(p: Record<string, unknown>) {
    let estreiaEm: number | null = null;
    if (p.estreiaEm !== undefined && p.estreiaEm !== null && p.estreiaEm !== '') {
        if (typeof p.estreiaEm === 'number') estreiaEm = inteiro(p.estreiaEm, 'Data de estreia', 0, 7289654400000);
        else if (typeof p.estreiaEm === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(p.estreiaEm)) {
            const [data] = p.estreiaEm.split('T');
            const [ano, mes, dia] = data.split('-').map(Number);
            if (mes < 1 || mes > 12 || dia < 1 || dia > new Date(Date.UTC(ano, mes, 0)).getUTCDate()) throw new ErroApi('Data de estreia inválida.');
            estreiaEm = Date.parse(p.estreiaEm);
            if (!Number.isFinite(estreiaEm) || estreiaEm < 0 || estreiaEm > 7289654400000) throw new ErroApi('Data de estreia inválida.');
        } else throw new ErroApi('Data de estreia inválida.');
    }
    const publicado = booleano(p.publicado, 'Publicação');
    const videoUrl = p.videoUrl === undefined || p.videoUrl === '' ? '' : enderecoMidia(p.videoUrl, 'Vídeo');
    if (publicado && !videoUrl) throw new ErroApi('Informe um vídeo antes de publicar.');
    return { id: idOpcional(p.id), tituloId: identificador(p.tituloId), temporadaId: p.temporadaId == null || p.temporadaId === '' ? null : identificador(p.temporadaId),
        numero: inteiro(p.numero, 'Número do episódio', 1, 100000), titulo: texto(p.titulo, 'Título do episódio', 1, 200),
        sinopse: texto(p.sinopse ?? '', 'Sinopse', 0, 5000), duracao: inteiro(p.duracao, 'Duração em minutos', 1, 600), videoUrl,
        poster: p.poster === undefined || p.poster === '' ? '' : enderecoMidia(p.poster, 'Pôster'), publicado, estreiaEm,
        arquivado: booleano(p.arquivado, 'Arquivamento'), motivo: texto(p.motivo, 'Motivo', 3, 500) };
}
