-- CreateEnum
CREATE TYPE "FxSnapshotStatus" AS ENUM ('ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "FxQuoteStatus" AS ENUM ('CREATED', 'ACCEPTED', 'EXPIRED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Transfer" ADD COLUMN     "exchangeRate" DECIMAL(20,8),
ADD COLUMN     "targetAmount" DECIMAL(20,8),
ADD COLUMN     "targetCurrency" TEXT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;

-- CreateTable
CREATE TABLE "FxRateSnapshot" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "baseCurrency" TEXT NOT NULL,
    "providerTimestamp" TIMESTAMP(3) NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ratesJson" JSONB NOT NULL,
    "status" "FxSnapshotStatus" NOT NULL DEFAULT 'ACCEPTED',
    "rejectReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FxRateSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FxQuote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fromAccountId" TEXT NOT NULL,
    "toAccountId" TEXT NOT NULL,
    "fromCurrency" TEXT NOT NULL,
    "toCurrency" TEXT NOT NULL,
    "fromAmount" DECIMAL(20,8) NOT NULL,
    "toAmount" DECIMAL(20,8) NOT NULL,
    "rateSnapshotId" TEXT NOT NULL,
    "midRate" DECIMAL(20,8) NOT NULL,
    "feeTotal" DECIMAL(20,8) NOT NULL,
    "feeBreakdownJson" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "FxQuoteStatus" NOT NULL DEFAULT 'CREATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "FxQuote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipient" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "payvostUserId" TEXT,
    "bankName" TEXT,
    "accountNumber" TEXT,
    "swiftCode" TEXT,
    "currency" TEXT,
    "country" TEXT,
    "type" TEXT NOT NULL DEFAULT 'EXTERNAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recipient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FxRateSnapshot_provider_status_idx" ON "FxRateSnapshot"("provider", "status");

-- CreateIndex
CREATE INDEX "FxRateSnapshot_fetchedAt_idx" ON "FxRateSnapshot"("fetchedAt");

-- CreateIndex
CREATE INDEX "FxQuote_userId_idx" ON "FxQuote"("userId");

-- CreateIndex
CREATE INDEX "FxQuote_rateSnapshotId_idx" ON "FxQuote"("rateSnapshotId");

-- CreateIndex
CREATE INDEX "FxQuote_status_expiresAt_idx" ON "FxQuote"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "Recipient_payvostUserId_idx" ON "Recipient"("payvostUserId");

-- CreateIndex
CREATE INDEX "Recipient_userId_idx" ON "Recipient"("userId");

-- AddForeignKey
ALTER TABLE "FxQuote" ADD CONSTRAINT "FxQuote_rateSnapshotId_fkey" FOREIGN KEY ("rateSnapshotId") REFERENCES "FxRateSnapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipient" ADD CONSTRAINT "Recipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
