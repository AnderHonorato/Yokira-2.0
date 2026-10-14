// Arquivo: src/app.d.ts
// Tipos globais do SvelteKit. `locals.usuario` e preenchido no hooks.server.ts.

import type { UsuarioDaSessao } from '$lib/servidor/autenticacao/sessao';
import type { Tema } from '$lib/validacoes/tema';

declare global {
  namespace App {
    interface Locals {
      usuario: UsuarioDaSessao | null;
      tema: Tema;
    }
    interface PageData {
      usuario: UsuarioDaSessao | null;
    }
  }
}

export {};
