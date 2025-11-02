-- CreateEnum
CREATE TYPE "ExternalProvider" AS ENUM ('RELOADLY', 'RAPYD', 'PAYSTACK', 'FLUTTERWAVE', 'STRIPE');

-- CreateEnum
CREATE TYPE "ExternalTransactionType" AS ENUM ('AIRTIME_TOPUP', 'DATA_BUNDLE', 'GIFT_CARD', 'BILL_PAYMENT', 'PAYMENT', 'PAYOUT', 'VIRTUAL_ACCOUNT_DEPOSIT', 'WALLET_TRANSFER', 'CARD_ISSUANCE');

-- CreateEnum
CREATE TYPE "ExternalTransactionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateTable
CREATE TABLE "ExternalTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT,
    "provider" "ExternalProvider" NOT NULL,
    "providerTransactionId" TEXT,
    "type" "ExternalTransactionType" NOT NULL,
    "status" "ExternalTransactionStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(20,8) NOT NULL,
    "currency" TEXT NOT NULL,
    "recipientDetails" JSONB,
    "metadata" JSONB,
    "errorMessage" TEXT,
    "webhookReceived" BOOLEAN NOT NULL DEFAULT false,
    "webhookData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ExternalTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExternalTransaction_providerTransactionId_key" ON "ExternalTransaction"("providerTransactionId");

-- CreateIndex
CREATE INDEX "ExternalTransaction_userId_idx" ON "ExternalTransaction"("userId");

-- CreateIndex
CREATE INDEX "ExternalTransaction_accountId_idx" ON "ExternalTransaction"("accountId");

-- CreateIndex
CREATE INDEX "ExternalTransaction_provider_idx" ON "ExternalTransaction"("provider");

-- CreateIndex
CREATE INDEX "ExternalTransaction_status_idx" ON "ExternalTransaction"("status");

-- CreateIndex
CREATE INDEX "ExternalTransaction_providerTransactionId_idx" ON "ExternalTransaction"("providerTransactionId");
