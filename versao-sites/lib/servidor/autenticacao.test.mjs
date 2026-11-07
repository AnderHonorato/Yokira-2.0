import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';

const sqlite = new DatabaseSync(':memory:');
sqlite.exec('PRAGMA foreign_keys=ON');
const pasta = new URL('../../drizzle/', import.meta.url);
for (const arquivo of readdirSync(pasta).filter(f => f.endsWith('.sql')).sort()) sqlite.exec(readFileSync(new URL(arquivo, pasta), 'utf8'));
class Prepared {
    constructor(query, params = []) { this.query = query; this.params = params; }
    bind(...params) { return new Prepared(this.query, params); }
    async raw() { const stmt = sqlite.prepare(this.query); stmt.setReturnArrays(true); return stmt.all(...this.params); }
    async all() { return { success: true, results: sqlite.prepare(this.query).all(...this.params), meta: {} }; }
    async run() { const r = sqlite.prepare(this.query).run(...this.params); return { success: true, results: [], meta: { changes: Number(r.changes) } }; }
}
globalThis.__contasEnv = { BETTER_AUTH_SECRET: 'segredo-de-testes-apenas-com-mais-de-32-caracteres', BETTER_AUTH_URL: 'https://yokira.test', YOKIRA_ADMIN_EMAILS: 'admin@exemplo.test',
    DB: { prepare(query) { return new Prepared(query); }, async batch(stmts) {
        sqlite.exec('BEGIN');
        try { const r = []; for (const stmt of stmts) r.push(await stmt.all()); sqlite.exec('COMMIT'); return r; }
        catch (erro) { sqlite.exec('ROLLBACK'); throw erro; }
    } } };
registerHooks({ resolve(specifier, context, next) {
    if (specifier === 'cloudflare:workers') return { url: 'data:text/javascript,export const env=globalThis.__contasEnv', shortCircuit: true };
    try { return next(specifier, context); } catch (erro) {
        if (specifier.startsWith('.')) for (const suffix of ['.ts', '/index.ts']) {
            const url = new URL(specifier + suffix, context.parentURL); if (existsSync(url)) return next(url.href, context);
        }
        throw erro;
    }
} });
const { POST, GET } = await import('../../app/api/auth/[...all]/route.ts');
const { contexto } = await import('./yokira.ts');
const { obterSessaoConta } = await import('./autenticacao.ts');
const api = await import('../../app/api/yokira/route.ts');
let ip = 1;
async function enviar(endpoint, dados, extras = {}) {
    return POST(new Request('https://yokira.test/api/auth/' + endpoint, { method: 'POST', headers: {
        'content-type': 'application/json', origin: 'https://yokira.test', 'cf-connecting-ip': `192.0.2.${ip++}`, ...extras
    }, body: JSON.stringify(dados) }));
}
const senha = 'UmaSenha!Segura123';
let cookie, id;
test('cadastro real guarda hash e sessão segura, nunca concede papel pelo e-mail', async () => {
    const r = await enviar('sign-up/email', { name: 'Pessoa Um', email: 'admin@exemplo.test', password: senha, emailVerified: true, papel: 'administrador' });
    assert.equal(r.status, 200, await r.clone().text());
    const setCookie = r.headers.get('set-cookie');
    assert.match(setCookie, /HttpOnly/i); assert.match(setCookie, /Secure/i); assert.match(setCookie, /SameSite=Lax/i);
    cookie = setCookie.split(';')[0];
    const dados = await r.json(); assert.equal(dados.user.emailVerified, false); assert.equal(dados.token, undefined);
    const credencial = sqlite.prepare('select senha_hash from auth_credenciais').get();
    assert.ok(credencial.senha_hash.length > 64); assert.notEqual(credencial.senha_hash, senha);
    const ctx = await contexto(new Request('https://yokira.test/api/yokira', { headers: { cookie, 'oai-authenticated-user-email': 'admin@exemplo.test' } }));
    id = ctx.usuario.id; assert.match(id, /^conta:/); assert.equal(ctx.usuario.papel, 'membro'); assert.equal(ctx.usuario.nome, 'Pessoa Um');
});
test('cadastro valida força, tamanho e duplicidade de e-mail normalizado', async () => {
    for (const password of ['abcdefghijklmnop', '123456789012', 'Curta!1', 'A!1a'.repeat(33)]) {
        assert.equal((await enviar('sign-up/email', { name: 'Pessoa', email: 'novo@exemplo.test', password })).status, 400);
    }
    const repetido = await enviar('sign-up/email', { name: 'Outra Pessoa', email: 'ADMIN@EXEMPLO.TEST', password: senha });
    assert.equal(repetido.status, 422); assert.match((await repetido.json()).erro, /já está cadastrado/);
    assert.equal((await enviar('sign-up/email', { name: 'admin@exemplo.test', email: 'outro@exemplo.test', password: senha })).status, 400);
});
test('login, sessão persistente, isolamento e saída revogam a sessão no servidor', async () => {
    const errado = await enviar('sign-in/email', { email: 'admin@exemplo.test', password: 'Errada!123456' });
    assert.equal(errado.status, 401);
    const login = await enviar('sign-in/email', { email: 'ADMIN@EXEMPLO.TEST', password: senha });
    assert.equal(login.status, 200, await login.clone().text());
    const cookieLogin = login.headers.get('set-cookie').split(';')[0];
    const request = new Request('https://yokira.test/api/yokira', { headers: { cookie: cookieLogin } });
    assert.equal((await obterSessaoConta(request)).id, id);
    const sessao = await GET(new Request('https://yokira.test/api/auth/get-session', { headers: { cookie: cookieLogin } }));
    assert.equal(sessao.status, 200);
    const dtoSessao=await sessao.json();
    assert.equal(dtoSessao.session?.token, undefined); assert.equal(dtoSessao.token, undefined);
    assert.deepEqual(Object.keys(dtoSessao.session||{}), ['expiresAt']);
    assert.deepEqual(Object.keys(dtoSessao.user||{}).sort(), ['emailVerified','id','name']);
    const outro = await enviar('sign-up/email', { name: 'Pessoa Dois', email: 'dois@exemplo.test', password: senha });
    assert.equal(outro.status, 200);
    const outroCtx = await contexto(new Request('https://yokira.test/api/yokira', { headers: { cookie: outro.headers.get('set-cookie').split(';')[0] } }));
    assert.notEqual(outroCtx.usuario.id, id);
    const cookieOutro = outro.headers.get('set-cookie').split(';')[0];
    async function progresso(selo, segundos, extras = {}) {
        return api.POST(new Request('https://yokira.test/api/yokira', { method: 'POST', headers: { cookie: selo, origin: 'https://yokira.test', 'content-type': 'application/json' },
            body: JSON.stringify({ acao: 'progresso', tituloId: 'demonstracao', segundos, ...extras }) }));
    }
    assert.equal((await progresso(cookieLogin, 37)).status, 200);
    assert.equal((await progresso(cookieOutro, 5, { usuarioId: id })).status, 200);
    assert.equal(sqlite.prepare('select segundos from progresso where usuario_id=?').get(id).segundos, 37);
    assert.equal(sqlite.prepare('select segundos from progresso where usuario_id=?').get(outroCtx.usuario.id).segundos, 5);
    const leitura = await api.GET(new Request('https://yokira.test/api/yokira', { headers: { cookie: cookieLogin } }));
    assert.equal(leitura.status, 200); assert.equal((await leitura.json()).usuario.id, id);
    assert.equal((await enviar('sign-out', {}, { cookie: cookieLogin })).status, 200);
    assert.equal(await obterSessaoConta(request), null);
    assert.equal((await obterSessaoConta(new Request('https://yokira.test', { headers: { cookie } }))).id, id);
});
test('rotas bloqueiam CSRF, endpoints não configurados e sessões forjadas ou expiradas', async () => {
    assert.equal((await enviar('sign-in/email', { email: 'admin@exemplo.test', password: senha }, { origin: 'https://malicioso.test' })).status, 403);
    assert.equal((await enviar('sign-in/email', { email: 'admin@exemplo.test', password: senha }, { origin: '' })).status, 403);
    assert.equal((await enviar('request-password-reset', { email: 'admin@exemplo.test' })).status, 404);
    const falso = new Request('https://yokira.test', { headers: { cookie: '__Secure-yokira_conta.session_token=inventado' } });
    assert.equal(await obterSessaoConta(falso), null);
    sqlite.exec('update auth_sessoes set expira_em=1');
    assert.equal(await obterSessaoConta(new Request('https://yokira.test', { headers: { cookie } })), null);
});
test('limite persistente por e-mail impede novas tentativas mesmo trocando de IP', async () => {
    const dados = { email: 'tentativas@exemplo.test', password: senha };
    for (let i = 0; i < 8; i++) assert.equal((await enviar('sign-in/email', dados)).status, 401);
    const bloqueio = await enviar('sign-in/email', dados); assert.equal(bloqueio.status, 429); assert.ok(bloqueio.headers.get('retry-after'));
});
test('ChatGPT continua funcionando e visitante sem cookie não exige secret de contas', async () => {
    delete globalThis.__contasEnv.BETTER_AUTH_SECRET;
    assert.equal(await obterSessaoConta(new Request('https://yokira.test')), null);
    const ctx = await contexto(new Request('https://yokira.test', { headers: { 'oai-authenticated-user-id': 'chatgpt-pessoa', 'oai-authenticated-user-full-name': 'Pessoa ChatGPT' } }));
    assert.equal(ctx.usuario.id, 'chatgpt-pessoa'); assert.equal(ctx.usuario.nome, 'Pessoa ChatGPT');
    await assert.rejects(contexto(new Request('https://yokira.test')), /Entre com sua conta/);
    const indisponivel = await enviar('sign-in/email', { email: 'teste@exemplo.test', password: senha }); assert.equal(indisponivel.status, 503);
    assert.deepEqual(sqlite.prepare('PRAGMA foreign_key_check').all(), []);
});
