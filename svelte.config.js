// Arquivo: svelte.config.js
// Adaptador Node porque a gente sobe o servidor com `node build/index.js` — sem depender de plataforma.

import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({ out: 'build' }),
    alias: {
      $componentes: 'src/lib/componentes',
      $visual: 'src/lib/visual',
      $servidor: 'src/lib/servidor',
      $cliente: 'src/lib/cliente'
    },
    // trustedOrigins vazio = so aceita POST vindo da propria origem.
    csrf: { trustedOrigins: [] }
  }
};
