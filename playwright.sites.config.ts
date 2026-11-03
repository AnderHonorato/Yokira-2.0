// Testa a interface React/Vinext efetivamente usada pela versão Sites.
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'testes/sites-mobile',
  timeout: 45_000,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: { baseURL: 'http://127.0.0.1:5173', trace: 'on-first-retry' },
  projects: [
    {
      name: 'celular-390',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 390, height: 844 },
        reducedMotion: 'no-preference'
      }
    },
    {
      name: 'desktop-1440',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 }
      }
    }
  ],
  webServer: {
    command: 'cd versao-sites && pnpm dev -- --host 127.0.0.1',
    url: 'http://127.0.0.1:5173',
    timeout: 180_000,
    reuseExistingServer: !process.env.CI
  }
});
