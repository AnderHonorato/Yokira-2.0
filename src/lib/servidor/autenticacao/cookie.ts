// Arquivo: src/lib/servidor/autenticacao/cookie.ts
// Um lugar so pra definir as flags do cookie. Espalhar isso pelos endpoints e receita
// de esquecer o HttpOnly em algum canto.

import type { Cookies } from '@sveltejs/kit';
import { NOME_COOKIE_SESSAO } from './sessao.js';
import { dev } from '$app/environment';

export function gravarCookieDeSessao(cookies: Cookies, id: string, expiraEm: Date): void {
  cookies.set(NOME_COOKIE_SESSAO, id, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: !dev,
    expires: expiraEm
  });
}

export function apagarCookieDeSessao(cookies: Cookies): void {
  cookies.delete(NOME_COOKIE_SESSAO, { path: '/' });
}
