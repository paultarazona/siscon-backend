ALTER TABLE "Incidencia"
  ADD COLUMN "sigomWorkOrderId" TEXT,
  ADD COLUMN "sigomWorkOrderCode" TEXT,
  ADD COLUMN "derivedAt" TIMESTAMP(3),
  ADD COLUMN "resolvedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Incidencia_sigomWorkOrderId_key" ON "Incidencia"("sigomWorkOrderId");

CREATE TABLE "IntegrationInbox" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "idempotencyKey" TEXT NOT NULL,
  "payloadHash" TEXT NOT NULL,
  "responseBody" JSONB NOT NULL,
  "incidentId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IntegrationInbox_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IntegrationInbox_idempotencyKey_key" ON "IntegrationInbox"("idempotencyKey");
CREATE INDEX "IntegrationInbox_incidentId_idx" ON "IntegrationInbox"("incidentId");
ALTER TABLE "IntegrationInbox" ADD CONSTRAINT "IntegrationInbox_incidentId_fkey"
  FOREIGN KEY ("incidentId") REFERENCES "Incidencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
