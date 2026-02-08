-- Payment links primitives (hosted checkout / pay-by-link).
-- This migration is intentionally self-contained (created without `prisma migrate dev`).

-- Enums
CREATE TYPE "PaymentLinkType" AS ENUM ('ONE_TIME', 'REUSABLE');
CREATE TYPE "PaymentLinkAmountType" AS ENUM ('FIXED', 'OPEN');
CREATE TYPE "PaymentLinkStatus" AS ENUM ('DRAFT', 'ACTIVE', 'DISABLED', 'EXPIRED');
CREATE TYPE "PaymentLinkCheckoutStatus" AS ENUM ('CREATING', 'CREATED', 'REDIRECTED', 'COMPLETED', 'FAILED', 'EXPIRED', 'CANCELLED');
CREATE TYPE "PaymentLinkPaymentStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED');
CREATE TYPE "WebhookEventStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'FAILED');

-- Tables
CREATE TABLE "PaymentLink" (
  "id" TEXT NOT NULL,
  "publicId" TEXT NOT NULL,
  "publicTokenHash" TEXT NOT NULL,
  "createdByUserId" TEXT NOT NULL,
  "workspaceId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "linkType" "PaymentLinkType" NOT NULL,
  "amountType" "PaymentLinkAmountType" NOT NULL,
  "amount" DECIMAL(20,8),
  "minAmount" DECIMAL(20,8),
  "maxAmount" DECIMAL(20,8),
  "currency" TEXT NOT NULL,
  "status" "PaymentLinkStatus" NOT NULL DEFAULT 'DRAFT',
  "expiresAt" TIMESTAMP(3),
  "successUrl" TEXT,
  "cancelUrl" TEXT,
  "failureUrl" TEXT,
  "viewCount" INTEGER NOT NULL DEFAULT 0,
  "checkoutCount" INTEGER NOT NULL DEFAULT 0,
  "paidCount" INTEGER NOT NULL DEFAULT 0,
  "totalPaidAmount" DECIMAL(20,8) NOT NULL DEFAULT 0,
  "fulfilledAt" TIMESTAMP(3),
  "fulfilledPaymentId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PaymentLink_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentLinkCheckout" (
  "id" TEXT NOT NULL,
  "paymentLinkId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "provider" "ExternalProvider" NOT NULL DEFAULT 'RAPYD',
  "providerCheckoutId" TEXT,
  "checkoutUrl" TEXT,
  "payerEmail" TEXT,
  "payerName" TEXT,
  "country" TEXT NOT NULL,
  "amount" DECIMAL(20,8) NOT NULL,
  "currency" TEXT NOT NULL,
  "status" "PaymentLinkCheckoutStatus" NOT NULL DEFAULT 'CREATING',
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PaymentLinkCheckout_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentLinkPayment" (
  "id" TEXT NOT NULL,
  "paymentLinkId" TEXT NOT NULL,
  "checkoutId" TEXT,
  "provider" "ExternalProvider" NOT NULL DEFAULT 'RAPYD',
  "providerPaymentId" TEXT NOT NULL,
  "amount" DECIMAL(20,8) NOT NULL,
  "currency" TEXT NOT NULL,
  "status" "PaymentLinkPaymentStatus" NOT NULL DEFAULT 'PROCESSING',
  "countedInTotals" BOOLEAN NOT NULL DEFAULT false,
  "externalTransactionId" TEXT,
  "providerData" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PaymentLinkPayment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WebhookEvent" (
  "id" TEXT NOT NULL,
  "provider" "ExternalProvider" NOT NULL,
  "eventType" TEXT NOT NULL,
  "providerEventId" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" "WebhookEventStatus" NOT NULL DEFAULT 'RECEIVED',
  "errorMessage" TEXT,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- Indexes / constraints
CREATE UNIQUE INDEX "PaymentLink_publicId_key" ON "PaymentLink"("publicId");
CREATE UNIQUE INDEX "PaymentLink_publicTokenHash_key" ON "PaymentLink"("publicTokenHash");
CREATE INDEX "PaymentLink_createdByUserId_createdAt_idx" ON "PaymentLink"("createdByUserId", "createdAt");
CREATE INDEX "PaymentLink_status_createdAt_idx" ON "PaymentLink"("status", "createdAt");
CREATE INDEX "PaymentLink_workspaceId_idx" ON "PaymentLink"("workspaceId");

CREATE UNIQUE INDEX "PaymentLinkCheckout_providerCheckoutId_key" ON "PaymentLinkCheckout"("providerCheckoutId");
CREATE UNIQUE INDEX "PaymentLinkCheckout_paymentLinkId_idempotencyKey_key" ON "PaymentLinkCheckout"("paymentLinkId", "idempotencyKey");
CREATE INDEX "PaymentLinkCheckout_paymentLinkId_createdAt_idx" ON "PaymentLinkCheckout"("paymentLinkId", "createdAt");
CREATE INDEX "PaymentLinkCheckout_provider_providerCheckoutId_idx" ON "PaymentLinkCheckout"("provider", "providerCheckoutId");
CREATE INDEX "PaymentLinkCheckout_status_createdAt_idx" ON "PaymentLinkCheckout"("status", "createdAt");

CREATE UNIQUE INDEX "PaymentLinkPayment_providerPaymentId_key" ON "PaymentLinkPayment"("providerPaymentId");
CREATE INDEX "PaymentLinkPayment_paymentLinkId_createdAt_idx" ON "PaymentLinkPayment"("paymentLinkId", "createdAt");
CREATE INDEX "PaymentLinkPayment_checkoutId_idx" ON "PaymentLinkPayment"("checkoutId");
CREATE INDEX "PaymentLinkPayment_provider_providerPaymentId_idx" ON "PaymentLinkPayment"("provider", "providerPaymentId");
CREATE INDEX "PaymentLinkPayment_status_createdAt_idx" ON "PaymentLinkPayment"("status", "createdAt");

CREATE UNIQUE INDEX "WebhookEvent_providerEventId_key" ON "WebhookEvent"("providerEventId");
CREATE INDEX "WebhookEvent_provider_receivedAt_idx" ON "WebhookEvent"("provider", "receivedAt");
CREATE INDEX "WebhookEvent_status_receivedAt_idx" ON "WebhookEvent"("status", "receivedAt");

-- Foreign keys
ALTER TABLE "PaymentLink" ADD CONSTRAINT "PaymentLink_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PaymentLinkCheckout" ADD CONSTRAINT "PaymentLinkCheckout_paymentLinkId_fkey"
  FOREIGN KEY ("paymentLinkId") REFERENCES "PaymentLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PaymentLinkPayment" ADD CONSTRAINT "PaymentLinkPayment_paymentLinkId_fkey"
  FOREIGN KEY ("paymentLinkId") REFERENCES "PaymentLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PaymentLinkPayment" ADD CONSTRAINT "PaymentLinkPayment_checkoutId_fkey"
  FOREIGN KEY ("checkoutId") REFERENCES "PaymentLinkCheckout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

