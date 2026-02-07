-- CreateTable
CREATE TABLE "AccountFundingSource" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerRef" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountFundingSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentIntentRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerRef" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "amount" DECIMAL(20,8) NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "clientSecret" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentIntentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountFundingSource_providerRef_key" ON "AccountFundingSource"("providerRef");

-- CreateIndex
CREATE INDEX "AccountFundingSource_accountId_idx" ON "AccountFundingSource"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentIntentRecord_providerRef_key" ON "PaymentIntentRecord"("providerRef");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentIntentRecord_idempotencyKey_key" ON "PaymentIntentRecord"("idempotencyKey");

-- CreateIndex
CREATE INDEX "PaymentIntentRecord_accountId_idx" ON "PaymentIntentRecord"("accountId");

-- CreateIndex
CREATE INDEX "PaymentIntentRecord_userId_idx" ON "PaymentIntentRecord"("userId");

-- AddForeignKey
ALTER TABLE "AccountFundingSource" ADD CONSTRAINT "AccountFundingSource_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

