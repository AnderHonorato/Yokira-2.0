// Arquivo: playwright.config.ts
// Dois projetos: celular de 390px e desktop de 1440px — as duas larguras das telas de referencia.
// Sobe o build de producao na 4100 pra nao brigar com o `npm run dev` que voce deixou aberto na 4000.

import { defineConfig, devices } from '@playwright/test';

const PORTA = Number(process.env.PORTA_TESTE ?? 4100);

/** Caixa de saida dos e-mails durante os testes. O teste de recuperacao le daqui. */
export const CAIXA_DE_SAIDA = process.env.EMAIL_ARQUIVO ?? './midia/emails-teste.jsonl';

/** Fica em midia/, que ja esta no .gitignore, e nunca encosta no dev.db. */
const BANCO_DA_SUITE = 'file:./midia/teste.db';

// Em maquina normal o Playwright acha o Chromium sozinho (npx playwright install).
// Em ambiente com o navegador pre-instalado em outro caminho, aponte CHROMIUM_EXECUTAVEL.
const executavel = process.env.CHROMIUM_EXECUTAVEL;
const lancamento = executavel ? { executablePath: executavel } : {};

export default defineConfig({
  testDir: 'testes/ponta-a-ponta',
  testMatch: '**/*.teste.ts',
  fullyParallel: true,
  // 60s por teste: o build de producao sobe junto e a maquina de CI e mais lenta que a local.
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://localhost:${PORTA}`,
    trace: 'on-first-retry'
  },
  projects: [
    { name: 'celular-390', use: { ...devices['Pixel 5'], launchOptions: lancamento } },
    {
      name: 'desktop-1440',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        launchOptions: lancamento
      }
    }
  ],
  webServer: {
    // Banco proprio da suite: rodar contra o dev.db enchia o banco de
    // desenvolvimento de contas de teste — 254 usuarios depois de algumas rodadas,
    // e cada cadastro custa um hash Argon2. A suite ficava mais lenta a cada vez.
    command: `npm run build && npm run teste:preparar && node build/index.js`,
    port: PORTA,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      PORT: String(PORTA),
      ORIGIN: `http://localhost:${PORTA}`,
      DATABASE_URL: process.env.DATABASE_URL ?? BANCO_DA_SUITE,
      // Build de producao se recusa a assinar midia com o valor de exemplo — e isso
      // e proposital. Os testes sobem com um segredo real, como um servidor de verdade.
      SEGREDO_SESSAO:
        process.env.SEGREDO_SESSAO ?? 'segredo-fixo-so-para-os-testes-de-ponta-a-ponta',
      PASTA_HLS: process.env.PASTA_HLS ?? './midia/hls',
      // Transporte de arquivo: o teste le a caixa de saida e segue o link de verdade,
      // em vez de fingir que o e-mail chegou.
      EMAIL_TRANSPORTE: 'arquivo',
      EMAIL_ARQUIVO: CAIXA_DE_SAIDA,
      NODE_ENV: 'production'
    }
  }
});
