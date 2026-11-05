import { configuracaoAutenticacao, obterAutenticacao } from './autenticacao';
import { lerEntrada, limitarAutenticacao, validarCredenciais } from './autenticacao-entrada';
import { ErroApi } from './validacao';

const mensagens: Record<string, string> = {
    USER_ALREADY_EXISTS: 'Este e-mail já está cadastrado. Entre com sua senha.',
    USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'Este e-mail já está cadastrado. Entre com sua senha.',
    INVALID_EMAIL_OR_PASSWORD: 'E-mail ou senha incorretos.',
    INVALID_PASSWORD: 'E-mail ou senha incorretos.',
    TOO_MANY_REQUESTS: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
};
function resposta(valor: unknown, status = 200, cabecalhos?: Headers) {
    const headers = new Headers(cabecalhos);
    headers.set('Cache-Control', 'private, no-store'); headers.set('X-Content-Type-Options', 'nosniff');
    if (status === 429) headers.set('Retry-After', '900');
    return Response.json(valor, { status, headers });
}
export async function atenderAutenticacao(request: Request): Promise<Response> {
    try {
        const caminho = new URL(request.url).pathname.replace(/\/$/, '');
        const leitura = caminho === '/api/auth/get-session' && request.method === 'GET';
        if (!leitura && (!['/api/auth/sign-in/email', '/api/auth/sign-up/email', '/api/auth/sign-out'].includes(caminho) || request.method !== 'POST'))
            throw new ErroApi('Recurso de autenticação não encontrado.', 404);
        const { origem } = configuracaoAutenticacao();
        if (new URL(request.url).origin !== origem) throw new ErroApi('Origem não permitida.', 403);
        let encaminhada = request;
        if (!leitura) {
            if (request.headers.get('origin') !== origem || request.headers.get('sec-fetch-site') === 'cross-site')
                throw new ErroApi('Origem não permitida.', 403);
            const entrada = await lerEntrada(request);
            const dados = caminho.endsWith('/sign-out') ? {} : validarCredenciais(entrada, caminho.includes('/sign-up/'));
            await limitarAutenticacao(request, 'email' in dados && typeof dados.email === 'string' ? dados.email : undefined);
            encaminhada = new Request(request.url, { method: 'POST', headers: request.headers, body: JSON.stringify(dados) });
        }
        const retorno = await obterAutenticacao().handler(encaminhada);
        const valor: unknown = await retorno.json().catch(() => null);
        const dados = valor && typeof valor === 'object' ? valor as Record<string, unknown> : null;
        if (!retorno.ok) {
            const mensagem = mensagens[typeof dados?.code === 'string' ? dados.code : ''] || (retorno.status === 429 ? mensagens.TOO_MANY_REQUESTS : 'Não foi possível concluir o acesso. Confira os dados e tente novamente.');
            return resposta({ erro: mensagem, error: mensagem }, retorno.status, retorno.headers);
        }
        // O token da sessão permanece exclusivamente no cookie HttpOnly.
        if (!dados) return resposta(null, retorno.status, retorno.headers);
        const pessoa = dados.user && typeof dados.user === 'object' ? dados.user as Record<string, unknown> : null;
        const sessao = dados.session && typeof dados.session === 'object' ? dados.session as Record<string, unknown> : null;
        return resposta({
            ...(pessoa ? {user: {id: pessoa.id, name: pessoa.name, emailVerified: pessoa.emailVerified === true}} : {}),
            ...(sessao ? {session: {expiresAt: sessao.expiresAt}} : {}),
            ...(dados.success === true ? {success: true} : {}),
        }, retorno.status, retorno.headers);
    } catch (erro) {
        if (erro instanceof ErroApi) return resposta({ erro: erro.message, error: erro.message }, erro.status);
        console.error('yokira_auth_error');
        return resposta({ erro: 'Não foi possível concluir o acesso. Tente novamente.' }, 500);
    }
}
