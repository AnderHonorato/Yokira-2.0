import { ErroApi } from './validacao';

export const LIMITE_MIDIA = 100 * 1024 * 1024;
const formatos: Record<string, { tipo: 'video' | 'imagem'; extensoes: string[] }> = {
    'video/mp4': { tipo: 'video', extensoes: ['mp4'] },
    'video/webm': { tipo: 'video', extensoes: ['webm'] },
    'image/png': { tipo: 'imagem', extensoes: ['png'] },
    'image/jpeg': { tipo: 'imagem', extensoes: ['jpg', 'jpeg'] },
    'image/webp': { tipo: 'imagem', extensoes: ['webp'] },
    'image/avif': { tipo: 'imagem', extensoes: ['avif'] }
};
export function validarEnvioMidia(request: Request) {
    if (request.headers.get('sec-fetch-site') === 'cross-site') throw new ErroApi('Origem não permitida.', 403);
    const origem = request.headers.get('origin');
    if (origem && origem !== new URL(request.url).origin) throw new ErroApi('Origem não permitida.', 403);
    let nome = '';
    try { nome = decodeURIComponent(request.headers.get('x-nome-arquivo') || ''); } catch { /* Nome inválido abaixo. */ }
    if (!nome || nome.length > 240 || /[\u0000-\u001f\u007f/\\]/.test(nome)) throw new ErroApi('Nome de arquivo inválido.');
    const mime = (request.headers.get('content-type') || '').trim().toLowerCase();
    const formato = formatos[mime];
    const extensao = nome.split('.').at(-1)?.toLowerCase() || '';
    if (!formato || !formato.extensoes.includes(extensao)) throw new ErroApi('Use MP4 ou WebM para vídeo; PNG, JPEG, WebP ou AVIF para imagem.', 415);
    const cabecalhos = [request.headers.get('content-length'), request.headers.get('x-tamanho-arquivo')].filter((v): v is string => v !== null);
    if (!cabecalhos.length) throw new ErroApi('Informe o tamanho do arquivo antes do envio.', 411);
    const tamanhos = cabecalhos.map(v => /^\d+$/.test(v) ? Number(v) : NaN);
    if (tamanhos.some(v => !Number.isSafeInteger(v) || v < 1)) throw new ErroApi('Tamanho de arquivo inválido.');
    if (tamanhos.some(v => v > LIMITE_MIDIA)) throw new ErroApi('O limite por arquivo é 100 MiB. Use uma URL externa para arquivos maiores.', 413);
    if (tamanhos.some(v => v !== tamanhos[0])) throw new ErroApi('O tamanho informado não corresponde ao envio.');
    if (!request.body) throw new ErroApi('Selecione um arquivo.');
    return { nome, mime, tipo: formato.tipo, tamanho: tamanhos[0], extensao };
}

/** Conta bytes enquanto o R2 consome o fluxo, sem carregar o arquivo na memória. */
export function limitarFluxoMidia(body: ReadableStream<Uint8Array>, esperado: number) {
    let tamanho = 0;
    return body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
        transform(parte, controller) {
            tamanho += parte.byteLength;
            if (tamanho > LIMITE_MIDIA) throw new ErroApi('O limite por arquivo é 100 MiB.', 413);
            if (tamanho > esperado) throw new ErroApi('O arquivo é maior que o tamanho informado.', 413);
            controller.enqueue(parte);
        },
        flush() { if (tamanho !== esperado) throw new ErroApi('O envio terminou antes de completar o arquivo.'); }
    }));
}

export function intervaloMidia(valor: string | null, tamanho: number) {
    if (!valor) return null;
    const partes = /^bytes=(\d*)-(\d*)$/.exec(valor);
    if (!partes || (!partes[1] && !partes[2])) throw new ErroApi('Intervalo de bytes inválido.', 416);
    const inicio = partes[1] ? Number(partes[1]) : Math.max(0, tamanho - Number(partes[2]));
    const fim = partes[1] && partes[2] ? Math.min(Number(partes[2]), tamanho - 1) : tamanho - 1;
    if (!Number.isSafeInteger(inicio) || !Number.isSafeInteger(fim) || inicio < 0 || inicio >= tamanho || fim < inicio || (!partes[1] && Number(partes[2]) === 0))
        throw new ErroApi('Intervalo de bytes inválido.', 416);
    return { inicio, fim, comprimento: fim - inicio + 1 };
}
