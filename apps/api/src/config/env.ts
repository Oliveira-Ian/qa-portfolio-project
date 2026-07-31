import 'dotenv/config';
import { z } from 'zod';

/**
 * Environment is read and validated exactly once, here, so a missing or
 * malformed variable fails at boot with a readable message instead of
 * surfacing later as a generic 500 on the first request that needs it.
 *
 * `dotenv/config` deliberately does *not* override an already-set variable:
 * `apps/api/.env` pins `PORT=3000`, but tooling that injects `PORT=3001` has to
 * win, or running the API alongside `apps/web` breaks.
 */
const DEV_JWT_SECRET = 'oliveira-erp-development-secret-do-not-use-in-production';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  // 0.0.0.0, not Fastify's localhost default — otherwise the server is
  // unreachable from outside a Docker container even with the port published.
  HOST: z.string().min(1).default('0.0.0.0'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(1).default(DEV_JWT_SECRET),
  /** Anything `jose` accepts: `30m`, `8h`, `7d`. */
  JWT_EXPIRES_IN: z.string().min(1).default('8h'),
  /**
   * Comma-separated allowlist for `@fastify/cors` — `apps/web` never calls
   * this API from the browser (it's a server-side-only client, see
   * `docs/adr/`), so this only matters for a browser hitting the API
   * directly: Swagger UI's own "Try it out", or a developer's own fetch
   * from the web app's origin during debugging. Defaults to that origin
   * rather than reflecting any `Origin` header, which is what having no
   * `origin` option configured at all used to do.
   */
  CORS_ORIGINS: z.string().min(1).default('http://localhost:3000'),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${details}`);
  }

  if (parsed.data.NODE_ENV === 'production' && parsed.data.JWT_SECRET === DEV_JWT_SECRET) {
    throw new Error('JWT_SECRET must be set to a real secret when NODE_ENV=production');
  }

  return parsed.data;
}

export const env = loadEnv();

export type Env = typeof env;

/** `CORS_ORIGINS` split and trimmed — what `app.ts` hands `@fastify/cors`'s `origin` option. */
export const corsOrigins = env.CORS_ORIGINS.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
