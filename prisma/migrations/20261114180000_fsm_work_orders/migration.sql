-- Oliveira FSM's work orders (plan 2.5): numbered per company, with the items
-- used and an append-only history. Company data under row-level security.

-- CreateEnum
CREATE TYPE "WorkOrderStatus" AS ENUM ('OPEN', 'SCHEDULED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED');
-- CreateEnum
CREATE TYPE "WorkOrderPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
-- CreateEnum
CREATE TYPE "WorkOrderEventType" AS ENUM ('CREATED', 'UPDATED', 'ASSIGNED', 'UNASSIGNED', 'STATUS_CHANGED', 'NOTE', 'ITEM_ADDED', 'ITEM_REMOVED');
-- CreateTable
CREATE TABLE "FsmCounter" (
    "companyId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "FsmCounter_pkey" PRIMARY KEY ("companyId","key")
);
-- CreateTable
CREATE TABLE "WorkOrder" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "customerId" TEXT NOT NULL,
    "equipmentId" TEXT,
    "serviceAddressId" TEXT,
    "typeId" TEXT NOT NULL,
    "branchId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "WorkOrderPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "WorkOrderStatus" NOT NULL DEFAULT 'OPEN',
    "assigneeMembershipId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "holdReason" TEXT,
    "cancellationReason" TEXT,
    "resolution" TEXT,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WorkOrder_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "WorkOrderItem" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "catalogItemId" TEXT NOT NULL,
    "kind" "CatalogItemKind" NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "unitPrice" DECIMAL(12,2),
    "quantity" DECIMAL(12,3) NOT NULL,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkOrderItem_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "WorkOrderEvent" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "type" "WorkOrderEventType" NOT NULL,
    "fromStatus" "WorkOrderStatus",
    "toStatus" "WorkOrderStatus",
    "message" TEXT,
    "payload" JSONB,
    "actorAccountId" INTEGER NOT NULL,
    "actorName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkOrderEvent_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE INDEX "WorkOrder_companyId_status_idx" ON "WorkOrder"("companyId", "status");
-- CreateIndex
CREATE INDEX "WorkOrder_companyId_assigneeMembershipId_status_idx" ON "WorkOrder"("companyId", "assigneeMembershipId", "status");
-- CreateIndex
CREATE INDEX "WorkOrder_companyId_customerId_idx" ON "WorkOrder"("companyId", "customerId");
-- CreateIndex
CREATE INDEX "WorkOrder_companyId_equipmentId_idx" ON "WorkOrder"("companyId", "equipmentId");
-- CreateIndex
CREATE INDEX "WorkOrder_companyId_scheduledAt_idx" ON "WorkOrder"("companyId", "scheduledAt");
-- CreateIndex
CREATE UNIQUE INDEX "WorkOrder_companyId_id_key" ON "WorkOrder"("companyId", "id");
-- CreateIndex
CREATE UNIQUE INDEX "WorkOrder_companyId_number_key" ON "WorkOrder"("companyId", "number");
-- CreateIndex
CREATE INDEX "WorkOrderItem_companyId_workOrderId_idx" ON "WorkOrderItem"("companyId", "workOrderId");
-- CreateIndex
CREATE UNIQUE INDEX "WorkOrderItem_companyId_id_key" ON "WorkOrderItem"("companyId", "id");
-- CreateIndex
CREATE INDEX "WorkOrderEvent_companyId_workOrderId_createdAt_idx" ON "WorkOrderEvent"("companyId", "workOrderId", "createdAt");
-- CreateIndex
CREATE UNIQUE INDEX "WorkOrderEvent_companyId_id_key" ON "WorkOrderEvent"("companyId", "id");
-- AddForeignKey
ALTER TABLE "FsmCounter" ADD CONSTRAINT "FsmCounter_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_companyId_customerId_fkey" FOREIGN KEY ("companyId", "customerId") REFERENCES "Customer"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_companyId_equipmentId_fkey" FOREIGN KEY ("companyId", "equipmentId") REFERENCES "Equipment"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_companyId_serviceAddressId_fkey" FOREIGN KEY ("companyId", "serviceAddressId") REFERENCES "Address"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_companyId_typeId_fkey" FOREIGN KEY ("companyId", "typeId") REFERENCES "WorkOrderType"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_companyId_branchId_fkey" FOREIGN KEY ("companyId", "branchId") REFERENCES "Branch"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_companyId_assigneeMembershipId_fkey" FOREIGN KEY ("companyId", "assigneeMembershipId") REFERENCES "Membership"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "WorkOrderItem" ADD CONSTRAINT "WorkOrderItem_companyId_workOrderId_fkey" FOREIGN KEY ("companyId", "workOrderId") REFERENCES "WorkOrder"("companyId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "WorkOrderItem" ADD CONSTRAINT "WorkOrderItem_companyId_catalogItemId_fkey" FOREIGN KEY ("companyId", "catalogItemId") REFERENCES "CatalogItem"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "WorkOrderEvent" ADD CONSTRAINT "WorkOrderEvent_companyId_workOrderId_fkey" FOREIGN KEY ("companyId", "workOrderId") REFERENCES "WorkOrder"("companyId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Row-level security (docs/adr/0012).
ALTER TABLE "FsmCounter" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FsmCounter" FORCE ROW LEVEL SECURITY;
CREATE POLICY company_isolation ON "FsmCounter"
  USING ("companyId" = current_setting('app.current_company_id', true))
  WITH CHECK ("companyId" = current_setting('app.current_company_id', true));

ALTER TABLE "WorkOrder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkOrder" FORCE ROW LEVEL SECURITY;
CREATE POLICY company_isolation ON "WorkOrder"
  USING ("companyId" = current_setting('app.current_company_id', true))
  WITH CHECK ("companyId" = current_setting('app.current_company_id', true));

ALTER TABLE "WorkOrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkOrderItem" FORCE ROW LEVEL SECURITY;
CREATE POLICY company_isolation ON "WorkOrderItem"
  USING ("companyId" = current_setting('app.current_company_id', true))
  WITH CHECK ("companyId" = current_setting('app.current_company_id', true));

ALTER TABLE "WorkOrderEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkOrderEvent" FORCE ROW LEVEL SECURITY;
CREATE POLICY company_isolation ON "WorkOrderEvent"
  USING ("companyId" = current_setting('app.current_company_id', true))
  WITH CHECK ("companyId" = current_setting('app.current_company_id', true));

