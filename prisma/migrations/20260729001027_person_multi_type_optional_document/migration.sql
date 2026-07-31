-- DropIndex
DROP INDEX "Person_type_idx";

-- Add the array column filled with a default first so existing rows get a
-- value, backfill each row's single `type` into it, then drop the default
-- (new rows must specify `types` explicitly) and the old scalar column.
-- Doing it in this order — rather than Prisma's auto-generated DROP+ADD —
-- is what keeps any existing Person rows' type from being silently lost.
ALTER TABLE "Person" ADD COLUMN "types" "PersonTypeValue"[] NOT NULL DEFAULT ARRAY[]::"PersonTypeValue"[];
UPDATE "Person" SET "types" = ARRAY["type"]::"PersonTypeValue"[] WHERE "type" IS NOT NULL;
ALTER TABLE "Person" ALTER COLUMN "types" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Person" DROP COLUMN "type",
ALTER COLUMN "document" DROP NOT NULL,
ALTER COLUMN "documentType" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Person_types_idx" ON "Person"("types");
