import { defineConfig } from 'vitest/config';
import { isolationDatabase } from './tests/isolation/database';

/**
 * Tenant-isolation tests (docs/adr/0012) — the approved exception to "no tests
 * unless asked". They run the API's own Prisma client and repositories against a
 * real, throwaway PostgreSQL database (`oliveira_test`, recreated by
 * `global-setup.ts`), never the development or demo database.
 *
 *   npm run test:isolation
 */
export default defineConfig({
  test: {
    include: ['tests/isolation/**/*.test.ts'],
    globalSetup: ['tests/isolation/global-setup.ts'],
    // The API reads DATABASE_URL at import; dotenv never overrides what is set here.
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: isolationDatabase.appUrl,
      LOG_LEVEL: 'silent',
      OTEL_SDK_DISABLED: 'true',
    },
    // One database, shared state across files: run them one after another.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 120_000,
  },
});
