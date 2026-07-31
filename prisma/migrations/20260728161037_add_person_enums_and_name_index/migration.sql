/*
  Warnings:

  - Changed the type of `documentType` on the `Person` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `type` on the `Person` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('CPF', 'CNPJ');

-- CreateEnum
CREATE TYPE "PersonType" AS ENUM ('CLIENT', 'SUPPLIER');

-- AlterTable
ALTER TABLE "Person" DROP COLUMN "documentType",
ADD COLUMN     "documentType" "DocumentType" NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "PersonType" NOT NULL;

-- CreateIndex
CREATE INDEX "Person_type_idx" ON "Person"("type");

-- CreateIndex
CREATE INDEX "Person_name_idx" ON "Person"("name");
