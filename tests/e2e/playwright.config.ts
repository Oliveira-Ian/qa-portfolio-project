import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const repoRoot = fileURLToPath(new URL('../../', import.meta.url));

// apps/api runs on PORT=3001 here so it doesn't collide with apps/web's own
// port 3000 — see docs/index.md "running apps/web and apps/api together".
export default defineConfig({
  testDir: '.',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npm run dev -w apps/api',
      cwd: repoRoot,
      env: { PORT: '3001' },
      url: 'http://localhost:3001/health',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: 'npm run dev -w apps/web',
      cwd: repoRoot,
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
});
