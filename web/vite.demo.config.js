import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { fileURLToPath } from 'node:url';

// Build estático de demonstração (um único HTML, sem servidor): npx vite build -c vite.demo.config.js --mode demo
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  resolve: { alias: [{ find: /^\.\.\/util\/api\.js$/, replacement: fileURLToPath(new URL('./demo/api.demo.js', import.meta.url)) }] },
  build: { outDir: 'dist-demo', assetsInlineLimit: 100000000 },
});
