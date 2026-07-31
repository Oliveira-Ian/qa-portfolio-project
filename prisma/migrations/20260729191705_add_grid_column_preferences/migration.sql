-- CreateTable
CREATE TABLE "GridColumnPreference" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER NOT NULL,
    "gridKey" TEXT NOT NULL,
    "columns" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GridColumnPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GridColumnPreference_accountId_gridKey_key" ON "GridColumnPreference"("accountId", "gridKey");

-- AddForeignKey
ALTER TABLE "GridColumnPreference" ADD CONSTRAINT "GridColumnPreference_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "AccessAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
