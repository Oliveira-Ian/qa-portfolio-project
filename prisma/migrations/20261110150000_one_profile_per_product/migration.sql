-- One profile per member per product (decided 2026-11-10).
--
-- Until now a member could hold several profiles in a product and got their
-- union. A member who holds more than one keeps the one with the most
-- permissions (ties: the oldest link) and loses the others. The link now
-- carries the profile's product, as part of its foreign key, so the database
-- refuses a link whose product disagrees with its profile.

ALTER TABLE "MembershipProfile" ADD COLUMN "product" "Product";

UPDATE "MembershipProfile" mp
SET "product" = p."product"
FROM "AccessProfile" p
WHERE p."id" = mp."profileId";

ALTER TABLE "MembershipProfile" ALTER COLUMN "product" SET NOT NULL;

DELETE FROM "MembershipProfile" mp
USING (
  SELECT ranked."id"
  FROM (
    SELECT mp2."id",
           ROW_NUMBER() OVER (
             PARTITION BY mp2."membershipId", mp2."product"
             ORDER BY (SELECT count(*) FROM "ProfilePermission" pp WHERE pp."profileId" = mp2."profileId") DESC,
                      mp2."assignedAt" ASC
           ) AS position
    FROM "MembershipProfile" mp2
  ) ranked
  WHERE ranked.position > 1
) extra
WHERE mp."id" = extra."id";

DROP INDEX "MembershipProfile_membershipId_profileId_key";
CREATE UNIQUE INDEX "MembershipProfile_membershipId_product_key" ON "MembershipProfile"("membershipId", "product");

ALTER TABLE "MembershipProfile" DROP CONSTRAINT "MembershipProfile_companyId_profileId_fkey";
CREATE UNIQUE INDEX "AccessProfile_companyId_id_product_key" ON "AccessProfile"("companyId", "id", "product");
ALTER TABLE "MembershipProfile" ADD CONSTRAINT "MembershipProfile_companyId_profileId_product_fkey"
  FOREIGN KEY ("companyId", "profileId", "product") REFERENCES "AccessProfile"("companyId", "id", "product") ON DELETE CASCADE ON UPDATE CASCADE;
