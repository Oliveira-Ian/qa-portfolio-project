import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';

const repoRoot = fileURLToPath(new URL('../../', import.meta.url));

export default defineConfig({
  testDir: '.',
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: process.env.API_BASE_URL ?? 'http://localhost:3000',
  },
  webServer: {
    command: 'npm run dev -w apps/api',
    cwd: repoRoot,
    url: 'http://localhost:3000/health',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
