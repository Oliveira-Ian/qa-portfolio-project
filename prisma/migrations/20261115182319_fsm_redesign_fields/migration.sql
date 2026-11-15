-- Oliveira FSM redesign (docs/design/fsm/HANDOFF-FSM.md § 9): nullable columns on
-- tables that already exist — no new table, so the company_isolation policies
-- of these tables already cover them. The two foreign keys are composite
-- (companyId, x) like every other one, so a row can only point inside its own
-- company.

-- CreateEnum
CREATE TYPE "EquipmentCriticality" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterTable
ALTER TABLE "Address" ADD COLUMN     "serviceHours" TEXT;

-- AlterTable
ALTER TABLE "CatalogItem" ADD COLUMN     "estimatedMinutes" INTEGER;

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "defaultBranchId" TEXT,
ADD COLUMN     "serviceInstructions" TEXT;

-- AlterTable
ALTER TABLE "Equipment" ADD COLUMN     "criticality" "EquipmentCriticality",
ADD COLUMN     "maintenanceIntervalDays" INTEGER;

-- AlterTable
ALTER TABLE "WorkOrder" ADD COLUMN     "contactId" TEXT,
ADD COLUMN     "estimatedMinutes" INTEGER,
ADD COLUMN     "externalReference" TEXT;

-- AlterTable
ALTER TABLE "WorkOrderType" ADD COLUMN     "countsAsPreventive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "defaultPriority" "WorkOrderPriority",
ADD COLUMN     "estimatedMinutes" INTEGER,
ADD COLUMN     "requiresEquipment" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slaHours" INTEGER;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_companyId_defaultBranchId_fkey" FOREIGN KEY ("companyId", "defaultBranchId") REFERENCES "Branch"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_companyId_contactId_fkey" FOREIGN KEY ("companyId", "contactId") REFERENCES "Contact"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "WorkOrder_companyId_contactId_idx" ON "WorkOrder"("companyId", "contactId");

-- The reference work-order types (REFERENCE_WORK_ORDER_TYPES, copied into each
-- company with the FSM) get the defaults and rules they are meant to have.
-- Only where nothing was set, and only for the reference names — a type a
-- company created or renamed is left as it is.
--
-- FORCE ROW LEVEL SECURITY applies the company policy to the table owner too,
-- and a migration runs with no company set — so the policy is lifted for these
-- statements only (NO FORCE: the owner bypasses it) and put back right after.
ALTER TABLE "WorkOrderType" NO FORCE ROW LEVEL SECURITY;
UPDATE "WorkOrderType" SET "requiresEquipment" = true, "countsAsPreventive" = true,
  "defaultPriority" = COALESCE("defaultPriority", 'NORMAL'), "estimatedMinutes" = COALESCE("estimatedMinutes", 120)
  WHERE "name" = 'Preventive maintenance';
UPDATE "WorkOrderType" SET "requiresEquipment" = true,
  "defaultPriority" = COALESCE("defaultPriority", 'HIGH'), "estimatedMinutes" = COALESCE("estimatedMinutes", 180),
  "slaHours" = COALESCE("slaHours", 24)
  WHERE "name" = 'Corrective maintenance';
UPDATE "WorkOrderType" SET "defaultPriority" = COALESCE("defaultPriority", 'NORMAL'), "estimatedMinutes" = COALESCE("estimatedMinutes", 240)
  WHERE "name" = 'Installation';
UPDATE "WorkOrderType" SET "defaultPriority" = COALESCE("defaultPriority", 'NORMAL'), "estimatedMinutes" = COALESCE("estimatedMinutes", 60)
  WHERE "name" = 'Technical visit';

ALTER TABLE "WorkOrderType" FORCE ROW LEVEL SECURITY;
