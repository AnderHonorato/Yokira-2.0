// Arquivo: vitest.config.ts
// Config separada da do Vite porque o vite.config.ts nao aceita mais a chave `test`.
// Os aliases repetem os do svelte.config.js pra dar pra testar rota de servidor direto,
// sem subir o SvelteKit inteiro.

import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const daRaiz = (caminho: string) => fileURLToPath(new URL(caminho, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      $componentes: daRaiz('./src/lib/componentes'),
      $visual: daRaiz('./src/lib/visual'),
      $servidor: daRaiz('./src/lib/servidor'),
      $cliente: daRaiz('./src/lib/cliente'),
      $lib: daRaiz('./src/lib')
    }
  },
  test: {
    include: ['testes/unitarios/**/*.teste.ts', 'testes/integracao/**/*.teste.ts'],
    environment: 'node',
    globals: false
  }
});
