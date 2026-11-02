export class ErroApi extends Error {
    status: number;
    constructor(message: string, status = 400) { super(message); this.status = status; }
}
export function texto(valor: unknown, nome: string, min: number, max: number): string {
    if (typeof valor !== 'string')
        throw new ErroApi(`${nome} inválido.`);
    const limpo = valor.trim().replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
    if (limpo.length < min || limpo.length > max)
        throw new ErroApi(`${nome} deve ter entre ${min} e ${max} caracteres.`);
    return limpo;
}
export function inteiro(valor: unknown, nome: string, min: number, max: number) {
    if (typeof valor !== 'number' || !Number.isSafeInteger(valor) || valor < min || valor > max)
        throw new ErroApi(`${nome} inválido.`);
    return valor;
}
export function identificador(valor: unknown) { return texto(valor, 'Identificador', 1, 160); }
export function nomeInicial(headers: Headers) {
    let nome = headers.get('oai-authenticated-user-full-name') || '';
    if (headers.get('oai-authenticated-user-full-name-encoding') === 'percent-encoded-utf-8') {
        try {
            nome = decodeURIComponent(nome);
        }
        catch {
            nome = '';
        }
    }
    return nome.trim().slice(0, 60) || 'Visitante';
}
export async function corpoJson(request: Request): Promise<Record<string, unknown>> {
    if (request.headers.get('sec-fetch-site') === 'cross-site')
        throw new ErroApi('Origem não permitida.', 403);
    const origem = request.headers.get('origin');
    if (origem && origem !== new URL(request.url).origin)
        throw new ErroApi('Origem não permitida.', 403);
    if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))
        throw new ErroApi('Envie JSON.', 415);
    if (Number(request.headers.get('content-length') || 0) > 65536)
        throw new ErroApi('Conteúdo muito grande.', 413);
    const reader = request.body?.getReader();
    if (!reader)
        throw new ErroApi('JSON inválido.');
    const partes: Uint8Array[] = [];
    let tamanho = 0;
    while (true) {
        const { value, done } = await reader.read();
        if (done)
            break;
        tamanho += value.byteLength;
        if (tamanho > 65536) {
            await reader.cancel();
            throw new ErroApi('Conteúdo muito grande.', 413);
        }
        partes.push(value);
    }
    const bytes = new Uint8Array(tamanho);
    let inicio = 0;
    for (const parte of partes) {
        bytes.set(parte, inicio);
        inicio += parte.length;
    }
    let valor: unknown;
    try {
        valor = JSON.parse(new TextDecoder().decode(bytes));
    }
    catch {
        throw new ErroApi('JSON inválido.');
    }
    if (!valor || typeof valor !== 'object' || Array.isArray(valor))
        throw new ErroApi('JSON inválido.');
    return valor as Record<string, unknown>;
}
