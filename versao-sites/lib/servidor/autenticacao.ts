import { env } from 'cloudflare:workers';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { getDb } from '../../db';
import * as esquema from './autenticacao-esquema';
import { ErroApi } from './validacao';

export type SessaoConta = { id: string; nome: string; email: string; emailVerificado: boolean };
type Configuracao = { BETTER_AUTH_SECRET?: string; BETTER_AUTH_URL?: string };
export function configuracaoAutenticacao() {
    const configuracao = env as unknown as Configuracao;
    let url: URL;
    try { url = new URL(configuracao.BETTER_AUTH_URL || ''); }
    catch { throw new ErroApi('O acesso por e-mail ainda não está configurado.', 503); }
    if (url.protocol !== 'https:' || url.username || url.password || !configuracao.BETTER_AUTH_SECRET || configuracao.BETTER_AUTH_SECRET.length < 32)
        throw new ErroApi('O acesso por e-mail ainda não está configurado.', 503);
    return { secret: configuracao.BETTER_AUTH_SECRET, origem: url.origin };
}
/** Configuração tardia mantém o catálogo e o login ChatGPT independentes de secrets de contas. */
export function obterAutenticacao() {
    const { secret, origem } = configuracaoAutenticacao();
    return betterAuth({
        appName: 'Yokira', baseURL: origem, basePath: '/api/auth', secret,
        database: drizzleAdapter(getDb(), { provider: 'sqlite', schema: esquema, transaction: false }),
        trustedOrigins: [origem],
        emailAndPassword: { enabled: true, minPasswordLength: 12, maxPasswordLength: 128, requireEmailVerification: false, autoSignIn: true },
        account: { accountLinking: { enabled: false } },
        session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24, cookieCache: { enabled: false } },
        advanced: {
            cookiePrefix: 'yokira_conta', useSecureCookies: true,
            defaultCookieAttributes: { httpOnly: true, secure: true, sameSite: 'lax', path: '/' },
            ipAddress: { ipAddressHeaders: ['cf-connecting-ip'] }
        },
        rateLimit: { enabled: true, storage: 'database', window: 60, max: 30,
            customRules: { '/sign-in/email': { window: 60, max: 10 }, '/sign-up/email': { window: 60, max: 5 } } },
        // Não existe remetente de e-mail configurado: nenhum endereço é marcado como verificado.
        logger: { disabled: true }, telemetry: { enabled: false }
    });
}
export async function obterSessaoConta(request: Request): Promise<SessaoConta | null> {
    if (!request.headers.get('cookie')?.includes('yokira_conta.session_token=')) return null;
    const resultado = await obterAutenticacao().api.getSession({ headers: request.headers });
    if (!resultado) return null;
    return { id: `conta:${resultado.user.id}`, nome: resultado.user.name, email: resultado.user.email, emailVerificado: resultado.user.emailVerified };
}
