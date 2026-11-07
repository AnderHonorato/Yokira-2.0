import { sql } from 'drizzle-orm';
import { getDb } from '../../db';
import { ErroApi } from './validacao';

export function validarCredenciais(valor: unknown, cadastro: boolean) {
    if (!valor || typeof valor !== 'object' || Array.isArray(valor)) throw new ErroApi('Informe os dados de acesso.');
    const dados = valor as Record<string, unknown>;
    const email = typeof dados.email === 'string' ? dados.email.trim().toLowerCase() : '';
    const nome = typeof dados.name === 'string' ? dados.name.trim() : '';
    const senha = dados.password;
    if (!email || email.length > 254 || !/^[^\s@\u0000-\u001f\u007f]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(email) ||
        typeof senha !== 'string' || senha.length < 1 || senha.length > 128 ||
        (dados.rememberMe !== undefined && typeof dados.rememberMe !== 'boolean') ||
        (cadastro && (nome.length < 2 || nome.length > 60 || /[@\u0000-\u001f\u007f]/.test(nome))))
        throw new ErroApi('Informe nome, e-mail e senha válidos. A senha aceita até 128 caracteres.');
    if (cadastro && (senha.length < 12 || !/\p{Ll}/u.test(senha) || !/\p{Lu}/u.test(senha) || !/\p{N}/u.test(senha) || !/[^\p{L}\p{N}\s]/u.test(senha)))
        throw new ErroApi('Use de 12 a 128 caracteres, com maiúscula, minúscula, número e símbolo.');
    return {email, password: senha, ...(cadastro ? {name: nome} : {}),
        ...(typeof dados.rememberMe === 'boolean' ? {rememberMe: dados.rememberMe} : {})};
}
export async function lerEntrada(request: Request): Promise<unknown> {
    if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new ErroApi('Envie JSON.', 415);
    if (Number(request.headers.get('content-length') || 0) > 8192) throw new ErroApi('Conteúdo muito grande.', 413);
    const leitor = request.body?.getReader();
    if (!leitor) throw new ErroApi('Informe os dados de acesso.');
    let tamanho = 0, corpo = '';
    const decoder = new TextDecoder();
    try {
        for (;;) {
            const { done, value } = await leitor.read();
            if (done) break;
            tamanho += value.byteLength;
            if (tamanho > 8192) { await leitor.cancel(); throw new ErroApi('Conteúdo muito grande.', 413); }
            corpo += decoder.decode(value, { stream: true });
        }
        corpo += decoder.decode();
        return JSON.parse(corpo);
    } catch (erro) {
        if (erro instanceof ErroApi) throw erro;
        throw new ErroApi('JSON inválido.');
    } finally { leitor.releaseLock(); }
}
async function consumir(chave: string, janela: number, maximo: number) {
    const agora = Date.now(), expira = (Math.floor(agora / janela) + 1) * janela;
    const db = getDb();
    const linhas = await db.all(sql`insert into auth_tentativas(chave,quantidade,expira_em) values(${chave},1,${expira})
        on conflict(chave) do update set quantidade=case when expira_em<=${agora} then 1 else quantidade+1 end,expira_em=${expira}
        where expira_em<=${agora} or quantidade<${maximo} returning quantidade`);
    if (!linhas.length) throw new ErroApi('Muitas tentativas. Aguarde alguns minutos e tente novamente.', 429);
    await db.run(sql`delete from auth_tentativas where expira_em<${agora}`);
}
/** Contadores persistentes e atômicos também limitam clientes sem cabeçalho de IP. */
export async function limitarAutenticacao(request: Request, email?: string) {
    const ip = request.headers.get('cf-connecting-ip')?.slice(0, 80) || 'sem-ip';
    await consumir(`ip:${ip}`, 60_000, 30);
    if (email) {
        const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(email));
        const chave = Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
        await consumir(`email:${chave}`, 15 * 60_000, 8);
    }
}
