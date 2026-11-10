-- Addresses and contacts of the company's registry (plan § 2.9, the essential of
-- F-14). A person or a branch has any number of typed addresses, one primary;
-- a person has any number of contact people. The flat address a person or a
-- branch had becomes its primary address, then the flat columns go.

CREATE TYPE "AddressType" AS ENUM ('COMMERCIAL', 'RESIDENTIAL', 'BILLING', 'SERVICE', 'DELIVERY', 'OTHER');

CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "personId" TEXT,
    "branchId" TEXT,
    "type" "AddressType" NOT NULL DEFAULT 'COMMERCIAL',
    "label" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "zipCode" TEXT,
    "street" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "district" TEXT,
    "city" TEXT,
    "state" TEXT,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Address_pkey" PRIMARY KEY ("id"),
    -- Exactly one owner.
    CONSTRAINT "Address_one_owner" CHECK (num_nonnulls("personId", "branchId") = 1)
);

CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Address_companyId_id_key" ON "Address"("companyId", "id");
CREATE INDEX "Address_companyId_personId_idx" ON "Address"("companyId", "personId");
CREATE INDEX "Address_companyId_branchId_idx" ON "Address"("companyId", "branchId");
-- One primary address per owner.
CREATE UNIQUE INDEX "Address_one_primary_per_person" ON "Address"("personId") WHERE "isPrimary" AND "personId" IS NOT NULL;
CREATE UNIQUE INDEX "Address_one_primary_per_branch" ON "Address"("branchId") WHERE "isPrimary" AND "branchId" IS NOT NULL;
CREATE UNIQUE INDEX "Contact_companyId_id_key" ON "Contact"("companyId", "id");
CREATE INDEX "Contact_companyId_personId_idx" ON "Contact"("companyId", "personId");
CREATE UNIQUE INDEX "Contact_one_primary_per_person" ON "Contact"("personId") WHERE "isPrimary";

ALTER TABLE "Address" ADD CONSTRAINT "Address_companyId_personId_fkey"
  FOREIGN KEY ("companyId", "personId") REFERENCES "Person"("companyId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Address" ADD CONSTRAINT "Address_companyId_branchId_fkey"
  FOREIGN KEY ("companyId", "branchId") REFERENCES "Branch"("companyId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_companyId_personId_fkey"
  FOREIGN KEY ("companyId", "personId") REFERENCES "Person"("companyId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- The flat address of a person or a branch becomes its primary address. Migrated
-- rows get a v4 id (PostgreSQL 16 has no v7 generator); new ones get v7.
INSERT INTO "Address" ("id", "companyId", "personId", "isPrimary", "zipCode", "street", "city", "state", "updatedAt")
SELECT gen_random_uuid()::text, "companyId", "id", true, "zipCode", "street", "city", "state", now()
FROM "Person"
WHERE COALESCE("street", "city", "state", "zipCode") IS NOT NULL;

INSERT INTO "Address" ("id", "companyId", "branchId", "isPrimary", "zipCode", "street", "city", "state", "updatedAt")
SELECT gen_random_uuid()::text, "companyId", "id", true, "zipCode", "street", "city", "state", now()
FROM "Branch"
WHERE COALESCE("street", "city", "state", "zipCode") IS NOT NULL;

ALTER TABLE "Person" DROP COLUMN "city",
DROP COLUMN "state",
DROP COLUMN "street",
DROP COLUMN "zipCode",
ADD COLUMN "mobile" TEXT,
ADD COLUMN "municipalRegistration" TEXT,
ADD COLUMN "stateRegistration" TEXT,
ADD COLUMN "tradeName" TEXT;

ALTER TABLE "Branch" DROP COLUMN "city",
DROP COLUMN "state",
DROP COLUMN "street",
DROP COLUMN "zipCode",
ADD COLUMN "document" TEXT,
ADD COLUMN "email" TEXT,
ADD COLUMN "phone" TEXT,
ADD COLUMN "stateRegistration" TEXT;

-- Row-level security (docs/adr/0012).
ALTER TABLE "Address" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Address" FORCE ROW LEVEL SECURITY;
CREATE POLICY company_isolation ON "Address"
  USING ("companyId" = current_setting('app.current_company_id', true))
  WITH CHECK ("companyId" = current_setting('app.current_company_id', true));

ALTER TABLE "Contact" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Contact" FORCE ROW LEVEL SECURITY;
CREATE POLICY company_isolation ON "Contact"
  USING ("companyId" = current_setting('app.current_company_id', true))
  WITH CHECK ("companyId" = current_setting('app.current_company_id', true));
