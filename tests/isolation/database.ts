/**
 * Where the isolation tests run. Defaults match the local Docker Compose
 * Postgres and the dev role passwords of `prisma/.env.example`; CI overrides
 * them. The database name must end in `_test` — `global-setup.ts` drops and
 * recreates it, so it refuses any other name.
 */
const host = process.env.ISOLATION_DB_HOST ?? 'localhost:5432';
const name = process.env.ISOLATION_DB_NAME ?? 'oliveira_test';

export const isolationDatabase = {
  name,
  /** The table owner: creates the database, runs the migrations and setup-roles. */
  ownerUrl:
    process.env.ISOLATION_MIGRATION_DATABASE_URL ??
    `postgresql://postgres:postgres@${host}/${name}`,
  /** The API's role — subject to row-level security. */
  appUrl:
    process.env.ISOLATION_DATABASE_URL ??
    `postgresql://oliveira_app:oliveira_app_dev@${host}/${name}`,
  /** BYPASSRLS — used by the tests only to arrange data and to look behind the API. */
  adminUrl:
    process.env.ISOLATION_ADMIN_DATABASE_URL ??
    `postgresql://oliveira_admin:oliveira_admin_dev@${host}/${name}`,
};
