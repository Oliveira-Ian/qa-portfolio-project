-- Oliveira FSM's base records (plan 2.5 and 2.9): customers over the company's
-- people, their equipment at the customers' addresses, the catalog of products
-- and services, and work order types. Company data under row-level security.

-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('ACTIVE', 'UNDER_MAINTENANCE', 'INACTIVE');
-- CreateEnum
CREATE TYPE "CatalogItemKind" AS ENUM ('PRODUCT', 'SERVICE');
-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "addressId" TEXT,
    "location" TEXT,
    "name" TEXT NOT NULL,
    "tag" TEXT,
    "category" TEXT,
    "manufacturer" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "installedAt" DATE,
    "warrantyUntil" DATE,
    "status" "EquipmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "CatalogItem" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "kind" "CatalogItemKind" NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'UN',
    "price" DECIMAL(12,2),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CatalogItem_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "WorkOrderType" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WorkOrderType_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE UNIQUE INDEX "Customer_companyId_id_key" ON "Customer"("companyId", "id");
-- CreateIndex
CREATE UNIQUE INDEX "Customer_companyId_personId_key" ON "Customer"("companyId", "personId");
-- CreateIndex
CREATE INDEX "Equipment_companyId_customerId_idx" ON "Equipment"("companyId", "customerId");
-- CreateIndex
CREATE INDEX "Equipment_companyId_name_idx" ON "Equipment"("companyId", "name");
-- CreateIndex
CREATE UNIQUE INDEX "Equipment_companyId_id_key" ON "Equipment"("companyId", "id");
-- CreateIndex
CREATE UNIQUE INDEX "Equipment_companyId_tag_key" ON "Equipment"("companyId", "tag");
-- CreateIndex
CREATE INDEX "CatalogItem_companyId_name_idx" ON "CatalogItem"("companyId", "name");
-- CreateIndex
CREATE UNIQUE INDEX "CatalogItem_companyId_id_key" ON "CatalogItem"("companyId", "id");
-- CreateIndex
CREATE UNIQUE INDEX "CatalogItem_companyId_code_key" ON "CatalogItem"("companyId", "code");
-- CreateIndex
CREATE UNIQUE INDEX "WorkOrderType_companyId_id_key" ON "WorkOrderType"("companyId", "id");
-- CreateIndex
CREATE UNIQUE INDEX "WorkOrderType_companyId_name_key" ON "WorkOrderType"("companyId", "name");
-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_companyId_personId_fkey" FOREIGN KEY ("companyId", "personId") REFERENCES "Person"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_companyId_customerId_fkey" FOREIGN KEY ("companyId", "customerId") REFERENCES "Customer"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_companyId_addressId_fkey" FOREIGN KEY ("companyId", "addressId") REFERENCES "Address"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "CatalogItem" ADD CONSTRAINT "CatalogItem_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "WorkOrderType" ADD CONSTRAINT "WorkOrderType_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Row-level security (docs/adr/0012).
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" FORCE ROW LEVEL SECURITY;
CREATE POLICY company_isolation ON "Customer"
  USING ("companyId" = current_setting('app.current_company_id', true))
  WITH CHECK ("companyId" = current_setting('app.current_company_id', true));

ALTER TABLE "Equipment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Equipment" FORCE ROW LEVEL SECURITY;
CREATE POLICY company_isolation ON "Equipment"
  USING ("companyId" = current_setting('app.current_company_id', true))
  WITH CHECK ("companyId" = current_setting('app.current_company_id', true));

ALTER TABLE "CatalogItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CatalogItem" FORCE ROW LEVEL SECURITY;
CREATE POLICY company_isolation ON "CatalogItem"
  USING ("companyId" = current_setting('app.current_company_id', true))
  WITH CHECK ("companyId" = current_setting('app.current_company_id', true));

ALTER TABLE "WorkOrderType" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkOrderType" FORCE ROW LEVEL SECURITY;
CREATE POLICY company_isolation ON "WorkOrderType"
  USING ("companyId" = current_setting('app.current_company_id', true))
  WITH CHECK ("companyId" = current_setting('app.current_company_id', true));

