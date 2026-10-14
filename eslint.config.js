// Arquivo: eslint.config.js
// Config flat do ESLint. Mantida enxuta de proposito: regra demais atrapalha mais do que ajuda.

import js from '@eslint/js';
import globals from 'globals';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs['flat/recommended'],
  prettier,
  ...svelte.configs['flat/prettier'],
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node }
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      // Desligada de proposito: `resolve()` so importa quando a app roda sob um caminho
      // base (ex.: /app). O Yokira e servido na raiz, entao seria ruido em cada <a href>.
      'svelte/no-navigation-without-resolve': 'off'
    }
  },
  {
    files: ['**/*.svelte'],
    languageOptions: { parserOptions: { parser: ts.parser } }
  },
  {
    ignores: [
      // Segmento HLS tem extensao .ts igual a TypeScript. Sem esta linha, o lint tenta
      // parsear video como codigo e quebra assim que alguem transcodifica um episodio.
      'midia/',
      'build/',
      '.svelte-kit/',
      'node_modules/',
      'static/',
      'playwright-report/',
      'test-results/',
      'prisma/gerado/'
    ]
  }
];
