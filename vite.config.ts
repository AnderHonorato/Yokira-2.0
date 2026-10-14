// Arquivo: vite.config.ts
// Porta 4000 fixa (strictPort) pra nao brigar com outros projetos que usam 3000/5173.
// O servidor de desenvolvimento escuta em todas as interfaces (host: true) pra abrir
// no celular pela rede local. O preview segue so no localhost, de proposito.

import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: { host: true, port: 4000, strictPort: true },
  preview: { port: 4000, strictPort: true }
});
