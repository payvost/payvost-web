-- Outbound payments primitives + ledger idempotency.
-- This migration is intentionally self-contained (created without `prisma migrate dev`).

-- Create enums
CREATE TYPE "PaymentOrderType" AS ENUM ('REMITTANCE', 'BILL_PAYMENT', 'GIFT_CARD', 'BULK_ITEM');
CREATE TYPE "PaymentOrderStatus" AS ENUM ('DRAFT', 'QUOTED', 'AUTHORIZED', 'SUBMITTED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED');
CREATE TYPE "PaymentAttemptStatus" AS ENUM ('CREATED', 'SUBMITTED', 'SUCCEEDED', 'FAILED');
CREATE TYPE "PaymentTemplateType" AS ENUM ('BILL_PAYMENT', 'GIFT_CARD');
CREATE TYPE "PaymentScheduleStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED');
CREATE TYPE "BulkBatchStatus" AS ENUM ('DRAFT', 'VALIDATED', 'SUBMITTED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE "BulkBatchItemStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- PaymentOrder: canonical state machine for outbound payments.
CREATE TABLE "PaymentOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceAccountId" TEXT NOT NULL,
    "type" "PaymentOrderType" NOT NULL,
    "status" "PaymentOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "idempotencyKey" TEXT NOT NULL,
    "sourceAmount" DECIMAL(20,8) NOT NULL,
    "sourceCurrency" TEXT NOT NULL,
    "targetAmount" DECIMAL(20,8) NOT NULL,
    "targetCurrency" TEXT NOT NULL,
    "feeAmount" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "feeCurrency" TEXT NOT NULL,
    "fxRate" DECIMAL(20,10),
    "fxProvider" TEXT,
    "fxSnapshotId" TEXT,
    "provider" "ExternalProvider",
    "providerRef" TEXT,
    "externalTxId" TEXT,
    "metadata" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "PaymentOrder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentAttempt" (
    "id" TEXT NOT NULL,
    "paymentOrderId" TEXT NOT NULL,
    "provider" "ExternalProvider" NOT NULL,
    "status" "PaymentAttemptStatus" NOT NULL DEFAULT 'CREATED',
    "requestPayloadHash" TEXT,
    "providerIdempotencyKey" TEXT,
    "providerRef" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PaymentAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentTemplate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "PaymentTemplateType" NOT NULL,
    "nickname" TEXT,
    "provider" "ExternalProvider" NOT NULL,
    "providerEntityId" TEXT NOT NULL,
    "fields" JSONB NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PaymentTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentSchedule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "PaymentOrderType" NOT NULL,
    "templateId" TEXT,
    "status" "PaymentScheduleStatus" NOT NULL DEFAULT 'ACTIVE',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "cron" TEXT NOT NULL,
    "nextRunAt" TIMESTAMP(3) NOT NULL,
    "lastRunAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PaymentSchedule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BulkBatch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceAccountId" TEXT NOT NULL,
    "status" "BulkBatchStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BulkBatch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BulkBatchItem" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "status" "BulkBatchItemStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(20,8) NOT NULL,
    "currency" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "paymentOrderId" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BulkBatchItem_pkey" PRIMARY KEY ("id")
);

-- Indexes / constraints
CREATE INDEX "PaymentOrder_userId_createdAt_idx" ON "PaymentOrder"("userId", "createdAt");
CREATE INDEX "PaymentOrder_status_createdAt_idx" ON "PaymentOrder"("status", "createdAt");
CREATE INDEX "PaymentOrder_provider_providerRef_idx" ON "PaymentOrder"("provider", "providerRef");
CREATE INDEX "PaymentOrder_sourceAccountId_idx" ON "PaymentOrder"("sourceAccountId");
CREATE UNIQUE INDEX "PaymentOrder_userId_type_idempotencyKey_key" ON "PaymentOrder"("userId", "type", "idempotencyKey");

CREATE INDEX "PaymentAttempt_paymentOrderId_createdAt_idx" ON "PaymentAttempt"("paymentOrderId", "createdAt");
CREATE INDEX "PaymentAttempt_provider_providerRef_idx" ON "PaymentAttempt"("provider", "providerRef");

CREATE INDEX "PaymentTemplate_userId_type_updatedAt_idx" ON "PaymentTemplate"("userId", "type", "updatedAt");
CREATE UNIQUE INDEX "PaymentTemplate_userId_type_provider_providerEntityId_key" ON "PaymentTemplate"("userId", "type", "provider", "providerEntityId");

CREATE INDEX "PaymentSchedule_userId_status_nextRunAt_idx" ON "PaymentSchedule"("userId", "status", "nextRunAt");
CREATE INDEX "PaymentSchedule_status_nextRunAt_idx" ON "PaymentSchedule"("status", "nextRunAt");

CREATE INDEX "BulkBatch_userId_createdAt_idx" ON "BulkBatch"("userId", "createdAt");
CREATE INDEX "BulkBatch_status_createdAt_idx" ON "BulkBatch"("status", "createdAt");

CREATE INDEX "BulkBatchItem_batchId_createdAt_idx" ON "BulkBatchItem"("batchId", "createdAt");
CREATE INDEX "BulkBatchItem_status_createdAt_idx" ON "BulkBatchItem"("status", "createdAt");

-- Clean up historical duplicates before enforcing idempotency constraint.
DELETE FROM "LedgerEntry"
WHERE "id" IN (
  SELECT "id" FROM (
    SELECT
      "id",
      ROW_NUMBER() OVER (PARTITION BY "accountId", "referenceId" ORDER BY "createdAt" DESC) AS rn
    FROM "LedgerEntry"
    WHERE "referenceId" IS NOT NULL
  ) t
  WHERE t.rn > 1
);

CREATE UNIQUE INDEX "LedgerEntry_accountId_referenceId_key" ON "LedgerEntry"("accountId", "referenceId");

-- Foreign keys
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_paymentOrderId_fkey"
  FOREIGN KEY ("paymentOrderId") REFERENCES "PaymentOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BulkBatchItem" ADD CONSTRAINT "BulkBatchItem_batchId_fkey"
  FOREIGN KEY ("batchId") REFERENCES "BulkBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

