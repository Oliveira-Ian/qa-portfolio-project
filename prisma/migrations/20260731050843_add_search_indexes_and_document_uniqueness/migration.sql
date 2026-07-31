-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateIndex
CREATE INDEX "Person_createdAt_idx" ON "Person"("createdAt");

-- CreateIndex
CREATE INDEX "Person_name_trgm_idx" ON "Person" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Person_document_trgm_idx" ON "Person" USING GIN ("document" gin_trgm_ops);

-- CreateIndex
CREATE UNIQUE INDEX "Person_document_documentType_key" ON "Person"("document", "documentType");
