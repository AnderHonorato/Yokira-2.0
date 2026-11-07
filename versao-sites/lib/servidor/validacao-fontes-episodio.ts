import { ErroApi, identificador, inteiro, texto } from './validacao';
import { enderecoMidia } from './validacao-acervo';

export type FonteEpisodio = { id: string; nome: string; tipo: 'direto' | 'drive' | 'incorporado'; url: string; ordem: number; ativo: boolean };
/** Validação sintática: nenhum provedor é consultado pelo servidor. */
function enderecoExterno(valor: unknown, origem?: string): URL {
    const endereco = texto(valor, 'URL do player', 1, 2048);
    if (!/^https:\/\//i.test(endereco) || /[\s\\\u0000-\u001f\u007f]/u.test(endereco)) throw new ErroApi('Players incorporados exigem URL HTTPS externa.');
    let url: URL;
    try { url = new URL(endereco); } catch { throw new ErroApi('URL do player inválida.'); }
    const host = url.hostname.toLowerCase().replace(/\.$/, '');
    const partes = host.split('.').map(Number);
    const ip = /^\d+\.\d+\.\d+\.\d+$/.test(host);
    const reservado = ip && (partes[0] === 0 || partes[0] === 10 || partes[0] === 127 || partes[0] >= 224 ||
        (partes[0] === 100 && partes[1] >= 64 && partes[1] <= 127) || (partes[0] === 169 && partes[1] === 254) ||
        (partes[0] === 172 && partes[1] >= 16 && partes[1] <= 31) || (partes[0] === 192 && [0, 168].includes(partes[1])) ||
        (partes[0] === 198 && [18, 19].includes(partes[1])));
    if (url.username || url.password || url.port && url.port !== '443' || !host.includes('.') || host.includes(':') || reservado ||
        /(?:^|\.)(?:localhost|local|internal|invalid|test|example)$/.test(host) || (origem && url.origin === new URL(origem).origin))
        throw new ErroApi('Use um player externo em domínio público HTTPS, sem credenciais ou endereço privado.');
    return url;
}
export function validarFonteEpisodio(valor: unknown, indice = 0, origem?: string): FonteEpisodio {
    if (!valor || typeof valor !== 'object' || Array.isArray(valor)) throw new ErroApi('Fonte de vídeo inválida.');
    const p = valor as Record<string, unknown>;
    if (!['direto', 'drive', 'incorporado'].includes(String(p.tipo))) throw new ErroApi('Tipo de fonte inválido.');
    const tipo = p.tipo as FonteEpisodio['tipo'];
    let url: string;
    if (tipo === 'direto') url = enderecoMidia(p.url, 'URL do vídeo');
    else {
        const externo = enderecoExterno(p.url, origem);
        if (tipo === 'drive') {
            const id = /^\/file\/d\/([a-zA-Z0-9_-]{10,200})\/(?:view|preview)\/?$/.exec(externo.pathname)?.[1];
            if (externo.hostname !== 'drive.google.com' || !id) throw new ErroApi('Google Drive: use o link /file/d/ID/view ou /preview.');
            url = `https://drive.google.com/file/d/${id}/preview`;
        } else url = externo.href;
    }
    if (p.ativo !== undefined && typeof p.ativo !== 'boolean') throw new ErroApi('Disponibilidade da fonte inválida.');
    return { id: p.id === undefined || p.id === '' ? crypto.randomUUID() : identificador(p.id), nome: texto(p.nome, 'Nome da fonte', 1, 80), tipo, url,
        ordem: inteiro(p.ordem ?? indice + 1, 'Ordem da fonte', 1, 1000), ativo: p.ativo === undefined ? true : p.ativo };
}
export function validarFontesEpisodio(valor: unknown, origem?: string): FonteEpisodio[] | undefined {
    if (valor === undefined) return undefined;
    if (!Array.isArray(valor) || valor.length > 12) throw new ErroApi('Cadastre até 12 fontes por episódio.');
    const fontes = valor.map((p, indice) => validarFonteEpisodio(p, indice, origem));
    if (new Set(fontes.map(p => p.id)).size !== fontes.length) throw new ErroApi('Identificadores de fontes não podem se repetir.');
    return fontes.sort((a, b) => a.ordem - b.ordem || a.id.localeCompare(b.id));
}
