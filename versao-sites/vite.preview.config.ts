import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const diretorio = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: resolve(diretorio, 'preview'),
  publicDir: resolve(diretorio, 'public'),
  base: process.env.YOKIRA_PUBLIC_BASE || '/',
  plugins: [react()],
  resolve: {
    alias: { '@': diretorio }
  },
  build: {
    outDir: resolve(diretorio, 'dist-preview'),
    emptyOutDir: true,
    target: 'es2022'
  },
  server: {
    port: 5175,
    strictPort: true
  }
});
