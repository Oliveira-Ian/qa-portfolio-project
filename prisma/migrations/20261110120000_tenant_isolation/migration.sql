-- Tenant isolation, first step (#60, docs/adr/0012 and 0013).
--
-- 1. AccessAccount stops pointing at a Person: the login keeps its own display
--    name, and a member's record in a company's registry is linked per company
--    from Membership.personId.
-- 2. Person becomes company data: companyId NOT NULL, unique keys and indexes
--    company-first, and row-level security that fails closed.
--
-- Until now exactly one company could exist (docs/adr/0018), so every existing
-- person belongs to it. The migration refuses to guess if that is not the case.

DO $$
DECLARE
  company_count integer;
  person_count integer;
BEGIN
  SELECT count(*) INTO company_count FROM "Company";
  SELECT count(*) INTO person_count FROM "Person";

  IF person_count > 0 AND company_count <> 1 THEN
    RAISE EXCEPTION
      'tenant_isolation: % people exist and % companies; every existing person is assigned to the single company, so exactly one must exist',
      person_count, company_count;
  END IF;
END $$;

-- 1. The account keeps its own display name -------------------------------------

ALTER TABLE "AccessAccount" ADD COLUMN "name" TEXT;

UPDATE "AccessAccount" a
SET "name" = p."name"
FROM "Person" p
WHERE p."id" = a."personId";

ALTER TABLE "AccessAccount" ALTER COLUMN "name" SET NOT NULL;

-- 2. Person belongs to a company ------------------------------------------------

ALTER TABLE "Person" ADD COLUMN "companyId" TEXT;

UPDATE "Person" SET "companyId" = (SELECT "id" FROM "Company" ORDER BY "createdAt" LIMIT 1);

ALTER TABLE "Person" ALTER COLUMN "companyId" SET NOT NULL;

-- 3. The member's registry record, per company -----------------------------------

ALTER TABLE "Membership" ADD COLUMN "personId" TEXT;

UPDATE "Membership" m
SET "personId" = a."personId"
FROM "AccessAccount" a
WHERE a."id" = m."accountId";

ALTER TABLE "AccessAccount" DROP CONSTRAINT "AccessAccount_personId_fkey";
DROP INDEX "AccessAccount_personId_key";
ALTER TABLE "AccessAccount" DROP COLUMN "personId";

-- 4. Keys and indexes, company-first -------------------------------------------

DROP INDEX "Person_active_idx";
DROP INDEX "Person_createdAt_idx";
DROP INDEX "Person_document_documentType_key";
DROP INDEX "Person_name_idx";
DROP INDEX "Person_types_idx";

CREATE UNIQUE INDEX "Person_companyId_id_key" ON "Person"("companyId", "id");
CREATE UNIQUE INDEX "Person_companyId_document_documentType_key" ON "Person"("companyId", "document", "documentType");
CREATE INDEX "Person_companyId_types_idx" ON "Person"("companyId", "types");
CREATE INDEX "Person_companyId_active_idx" ON "Person"("companyId", "active");
CREATE INDEX "Person_companyId_createdAt_idx" ON "Person"("companyId", "createdAt");
CREATE INDEX "Person_companyId_name_idx" ON "Person"("companyId", "name");
CREATE UNIQUE INDEX "Membership_companyId_personId_key" ON "Membership"("companyId", "personId");

ALTER TABLE "Person" ADD CONSTRAINT "Person_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Composite: a membership can only link a person of its own company.
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_companyId_personId_fkey"
  FOREIGN KEY ("companyId", "personId") REFERENCES "Person"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 5. Row-level security --------------------------------------------------------
--
-- The company comes from a transaction-local setting the API sets on every
-- operation (apps/api/src/config/prisma.ts). With no setting the comparison is
-- NULL or '' and matches nothing: reads return no rows and writes are refused.
-- FORCE makes the policy apply to the table owner too; only a role with
-- BYPASSRLS (the seed's) or a superuser skips it.

ALTER TABLE "Person" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Person" FORCE ROW LEVEL SECURITY;

CREATE POLICY company_isolation ON "Person"
  USING ("companyId" = current_setting('app.current_company_id', true))
  WITH CHECK ("companyId" = current_setting('app.current_company_id', true));
