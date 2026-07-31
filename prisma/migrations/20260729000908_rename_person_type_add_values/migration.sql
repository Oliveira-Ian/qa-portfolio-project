-- Rename in place (not drop+recreate) so any existing Person rows keep their
-- `type` value intact. Postgres allows ADD VALUE outside a transaction block;
-- it must NOT be consumed by the same migration that adds it (Postgres
-- forbids using a brand-new enum value before the transaction that added it
-- commits) — the column type change lives in the next migration instead.
ALTER TYPE "PersonType" RENAME TO "PersonTypeValue";
ALTER TYPE "PersonTypeValue" ADD VALUE 'USER';
ALTER TYPE "PersonTypeValue" ADD VALUE 'EMPLOYEE';
