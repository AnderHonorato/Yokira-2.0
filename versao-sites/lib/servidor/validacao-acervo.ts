import type { Anime, Editorial } from '../catalogo';
import { ErroApi, identificador, inteiro, texto } from './validacao';

export type DadosTitulo = Omit<Anime, 'id'>;
export type DadosEditorial = Omit<Editorial, 'id'>;
type Alteracao = { alvoId?: string; oculto: boolean; motivo: string } & (
    { tipo: 'titulo'; dados: DadosTitulo } | { tipo: 'editorial'; dados: DadosEditorial });
function objeto(valor: unknown): Record<string, unknown> {
    if (!valor || typeof valor !== 'object' || Array.isArray(valor)) throw new ErroApi('Dados do conteúdo inválidos.');
    return valor as Record<string, unknown>;
}
function campos(dados: Record<string, unknown>, obrigatorios: string[], opcionais: string[] = []) {
    if (obrigatorios.some(chave => !Object.hasOwn(dados, chave)) || Object.keys(dados).some(chave => ![...obrigatorios, ...opcionais].includes(chave)))
        throw new ErroApi('Informe todos os campos do conteúdo, sem propriedades adicionais.');
}
export function enderecoMidia(valor: unknown, nome: string): string {
    const endereco = texto(valor, nome, 1, 2048);
    if (/[\s\\\u0000-\u001F\u007F]/u.test(endereco)) throw new ErroApi(`${nome}: endereço inválido.`);
    try {
        if (endereco.startsWith('/') && !endereco.startsWith('//')) {
            const decodificado = decodeURIComponent(endereco);
            if (decodificado.startsWith('//') || /[\\\u0000-\u001F\u007F]/u.test(decodificado)) throw new Error();
            const url = new URL(endereco, 'https://yokira.local');
            if (url.origin === 'https://yokira.local') return endereco;
        } else {
            const url = new URL(endereco);
            if (url.protocol === 'https:' && !url.username && !url.password) return url.href;
        }
    } catch { /* Erro público abaixo. */ }
    throw new ErroApi(`${nome}: use um caminho local ou URL HTTPS sem credenciais.`);
}
function ano(valor: unknown, nome: string): number { return inteiro(valor, nome, 1900, 2200); }
function validarTitulo(p: Record<string, unknown>): DadosTitulo {
    campos(p, ['slug','nome','sinopse','ano','nota','generos','tipo','status','episodios','duracao','poster','capa','estreia'], ['video']);
    const slug = texto(p.slug, 'Slug', 1, 120);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new ErroApi('Slug deve conter letras minúsculas, números e hífens.');
    if (p.tipo !== 'Série' && p.tipo !== 'Filme') throw new ErroApi('Tipo de título inválido.');
    if (p.status !== 'Completo' && p.status !== 'Em exibição' && p.status !== 'Em breve') throw new ErroApi('Status inválido.');
    if (typeof p.nota !== 'number' || !Number.isFinite(p.nota) || p.nota < 0 || p.nota > 10 || Math.abs(p.nota * 10 - Math.round(p.nota * 10)) > 1e-8)
        throw new ErroApi('Nota deve estar entre 0 e 10, com até uma casa decimal.');
    if (!Array.isArray(p.generos) || p.generos.length < 1 || p.generos.length > 12) throw new ErroApi('Informe de 1 a 12 gêneros.');
    const generos = p.generos.map(valor => texto(valor, 'Gênero', 2, 40));
    if (new Set(generos.map(valor => valor.toLocaleLowerCase('pt-BR'))).size !== generos.length) throw new ErroApi('Gêneros não podem se repetir.');
    const estreia = texto(p.estreia, 'Ano de estreia', 4, 4);
    if (!/^\d{4}$/.test(estreia)) throw new ErroApi('Estreia deve ser um ano com quatro dígitos.');
    ano(Number(estreia), 'Ano de estreia');
    return { slug, nome: texto(p.nome, 'Nome', 2, 200), sinopse: texto(p.sinopse, 'Sinopse', 10, 5000),
        ano: ano(p.ano, 'Ano'), nota: p.nota, generos, tipo: p.tipo, status: p.status,
        episodios: inteiro(p.episodios, 'Episódios', 0, 100000), duracao: inteiro(p.duracao, 'Duração', 1, 600),
        poster: enderecoMidia(p.poster, 'Pôster'), capa: enderecoMidia(p.capa, 'Capa'), estreia,
        ...(Object.hasOwn(p, 'video') ? { video: enderecoMidia(p.video, 'Vídeo') } : {}) };
}
function validarEditorial(p: Record<string, unknown>): DadosEditorial {
    campos(p, ['titulo','resumo','corpo','imagem','categoria','data']);
    const data = texto(p.data, 'Data', 10, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || !Number.isFinite(Date.parse(data)) || new Date(data).toISOString().slice(0, 10) !== data)
        throw new ErroApi('Data editorial inválida.');
    ano(Number(data.slice(0, 4)), 'Ano editorial');
    return { titulo: texto(p.titulo, 'Título', 2, 200), resumo: texto(p.resumo, 'Resumo', 10, 1000),
        corpo: texto(p.corpo, 'Texto', 10, 30000), imagem: enderecoMidia(p.imagem, 'Imagem'),
        categoria: texto(p.categoria, 'Categoria', 2, 60), data };
}
export function validarAlteracaoAcervo(p: Record<string, unknown>): Alteracao {
    const alvoId = p.alvoId === undefined && p.tipo === 'titulo' ? undefined : identificador(p.alvoId);
    if (alvoId !== undefined && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(alvoId)) throw new ErroApi('Identificador inválido.');
    if (typeof p.oculto !== 'boolean') throw new ErroApi('Disponibilidade inválida.');
    const comum = { alvoId, oculto: p.oculto, motivo: texto(p.motivo, 'Motivo', 3, 500) };
    if (p.tipo === 'titulo') return { ...comum, tipo: 'titulo', dados: validarTitulo(objeto(p.dados)) };
    if (p.tipo === 'editorial') return { ...comum, tipo: 'editorial', dados: validarEditorial(objeto(p.dados)) };
    throw new ErroApi('Tipo de conteúdo inválido.');
}
