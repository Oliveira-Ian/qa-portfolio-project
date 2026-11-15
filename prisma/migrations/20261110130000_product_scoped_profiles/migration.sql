-- Profiles per company and per product (docs/adr/0018, #60 follow-up).
--
-- Every permission and every profile that exists today is the ERP's, and every
-- profile belongs to the single company that existed. An account's profile links
-- move to its membership, so the same login can hold different profiles in
-- different companies. Profiles, their permissions and the links are company
-- data under row-level security.

DO $$
DECLARE
  company_count integer;
  profile_count integer;
BEGIN
  SELECT count(*) INTO company_count FROM "Company";
  SELECT count(*) INTO profile_count FROM "AccessProfile";

  IF profile_count > 0 AND company_count <> 1 THEN
    RAISE EXCEPTION
      'product_scoped_profiles: % profiles exist and % companies; every existing profile is assigned to the single company, so exactly one must exist',
      profile_count, company_count;
  END IF;
END $$;

-- 1. The catalog gains its product ------------------------------------------------

ALTER TABLE "Permission" ADD COLUMN "product" "Product" NOT NULL DEFAULT 'ERP';
ALTER TABLE "Permission" ALTER COLUMN "product" DROP DEFAULT;
DROP INDEX "Permission_resource_action_key";
CREATE UNIQUE INDEX "Permission_product_resource_action_key" ON "Permission"("product", "resource", "action");

-- 2. A profile belongs to a company and a product ---------------------------------

ALTER TABLE "AccessProfile" ADD COLUMN "companyId" TEXT;
ALTER TABLE "AccessProfile" ADD COLUMN "product" "Product" NOT NULL DEFAULT 'ERP';
ALTER TABLE "AccessProfile" ALTER COLUMN "product" DROP DEFAULT;
UPDATE "AccessProfile" SET "companyId" = (SELECT "id" FROM "Company" ORDER BY "createdAt" LIMIT 1);
ALTER TABLE "AccessProfile" ALTER COLUMN "companyId" SET NOT NULL;

DROP INDEX "AccessProfile_name_key";
CREATE UNIQUE INDEX "AccessProfile_companyId_id_key" ON "AccessProfile"("companyId", "id");
CREATE UNIQUE INDEX "AccessProfile_companyId_product_name_key" ON "AccessProfile"("companyId", "product", "name");
CREATE INDEX "AccessProfile_companyId_product_idx" ON "AccessProfile"("companyId", "product");
ALTER TABLE "AccessProfile" ADD CONSTRAINT "AccessProfile_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 3. A profile's permissions carry its company -----------------------------------

ALTER TABLE "ProfilePermission" ADD COLUMN "companyId" TEXT;
UPDATE "ProfilePermission" pp
SET "companyId" = p."companyId"
FROM "AccessProfile" p
WHERE p."id" = pp."profileId";
ALTER TABLE "ProfilePermission" ALTER COLUMN "companyId" SET NOT NULL;

ALTER TABLE "ProfilePermission" DROP CONSTRAINT "ProfilePermission_profileId_fkey";
CREATE INDEX "ProfilePermission_companyId_idx" ON "ProfilePermission"("companyId");
ALTER TABLE "ProfilePermission" ADD CONSTRAINT "ProfilePermission_companyId_profileId_fkey"
  FOREIGN KEY ("companyId", "profileId") REFERENCES "AccessProfile"("companyId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. Profile links move from the account to the membership ------------------------

CREATE UNIQUE INDEX "Membership_companyId_id_key" ON "Membership"("companyId", "id");

CREATE TABLE "MembershipProfile" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "profileId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MembershipProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MembershipProfile_companyId_id_key" ON "MembershipProfile"("companyId", "id");
CREATE UNIQUE INDEX "MembershipProfile_membershipId_profileId_key" ON "MembershipProfile"("membershipId", "profileId");
CREATE INDEX "MembershipProfile_companyId_profileId_idx" ON "MembershipProfile"("companyId", "profileId");
ALTER TABLE "MembershipProfile" ADD CONSTRAINT "MembershipProfile_companyId_membershipId_fkey"
  FOREIGN KEY ("companyId", "membershipId") REFERENCES "Membership"("companyId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MembershipProfile" ADD CONSTRAINT "MembershipProfile_companyId_profileId_fkey"
  FOREIGN KEY ("companyId", "profileId") REFERENCES "AccessProfile"("companyId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrated links get a v4 id (PostgreSQL 16 has no v7 generator); new ones get
-- v7 from the application. Links of an account with no membership granted
-- nothing (no seat, no company) and are not carried over.
INSERT INTO "MembershipProfile" ("id", "companyId", "membershipId", "profileId", "assignedAt")
SELECT gen_random_uuid()::text, m."companyId", m."id", ap."profileId", ap."assignedAt"
FROM "AccountProfile" ap
JOIN "Membership" m ON m."accountId" = ap."accountId"
JOIN "AccessProfile" p ON p."id" = ap."profileId" AND p."companyId" = m."companyId";

DROP TABLE "AccountProfile";

-- 5. Row-level security ----------------------------------------------------------

ALTER TABLE "AccessProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AccessProfile" FORCE ROW LEVEL SECURITY;
CREATE POLICY company_isolation ON "AccessProfile"
  USING ("companyId" = current_setting('app.current_company_id', true))
  WITH CHECK ("companyId" = current_setting('app.current_company_id', true));

ALTER TABLE "ProfilePermission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProfilePermission" FORCE ROW LEVEL SECURITY;
CREATE POLICY company_isolation ON "ProfilePermission"
  USING ("companyId" = current_setting('app.current_company_id', true))
  WITH CHECK ("companyId" = current_setting('app.current_company_id', true));

ALTER TABLE "MembershipProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MembershipProfile" FORCE ROW LEVEL SECURITY;
CREATE POLICY company_isolation ON "MembershipProfile"
  USING ("companyId" = current_setting('app.current_company_id', true))
  WITH CHECK ("companyId" = current_setting('app.current_company_id', true));
