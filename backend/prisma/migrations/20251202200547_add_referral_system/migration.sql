-- CreateEnum
CREATE TYPE "ReferralRewardType" AS ENUM ('SIGNUP_BONUS', 'FIRST_TRANSACTION', 'MONTHLY_ACTIVE', 'TIER_UPGRADE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ReferralRewardStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ReferralTier" AS ENUM ('TIER_1', 'TIER_2', 'TIER_3');

-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'RAPYD';

-- CreateTable
CREATE TABLE "ReferralCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "ReferralCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredId" TEXT NOT NULL,
    "referralCodeId" TEXT NOT NULL,
    "tier" "ReferralTier" NOT NULL DEFAULT 'TIER_1',
    "parentReferralId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "referredKycStatus" TEXT,
    "firstTransactionAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralReward" (
    "id" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rewardType" "ReferralRewardType" NOT NULL,
    "amount" DECIMAL(20,8) NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "ReferralRewardStatus" NOT NULL DEFAULT 'PENDING',
    "tier" "ReferralTier" NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "accountId" TEXT,
    "transferId" TEXT,
    "paidAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "cancelledReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "ReferralReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "signupBonus" DECIMAL(20,8),
    "signupCurrency" TEXT,
    "firstTxBonus" DECIMAL(20,8),
    "firstTxCurrency" TEXT,
    "firstTxMinAmount" DECIMAL(20,8),
    "tier2Percentage" DECIMAL(5,2),
    "tier3Percentage" DECIMAL(5,2),
    "minKycLevel" TEXT,
    "eligibleCountries" TEXT[],
    "excludedCountries" TEXT[],
    "maxReferralsPerUser" INTEGER,
    "maxRewardPerUser" DECIMAL(20,8),
    "maxRewardPerCampaign" DECIMAL(20,8),
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReferralCode_userId_key" ON "ReferralCode"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralCode_code_key" ON "ReferralCode"("code");

-- CreateIndex
CREATE INDEX "ReferralCode_code_idx" ON "ReferralCode"("code");

-- CreateIndex
CREATE INDEX "ReferralCode_userId_idx" ON "ReferralCode"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referredId_key" ON "Referral"("referredId");

-- CreateIndex
CREATE INDEX "Referral_referrerId_idx" ON "Referral"("referrerId");

-- CreateIndex
CREATE INDEX "Referral_referredId_idx" ON "Referral"("referredId");

-- CreateIndex
CREATE INDEX "Referral_referralCodeId_idx" ON "Referral"("referralCodeId");

-- CreateIndex
CREATE INDEX "Referral_tier_idx" ON "Referral"("tier");

-- CreateIndex
CREATE INDEX "Referral_isActive_idx" ON "Referral"("isActive");

-- CreateIndex
CREATE INDEX "ReferralReward_referralId_idx" ON "ReferralReward"("referralId");

-- CreateIndex
CREATE INDEX "ReferralReward_userId_idx" ON "ReferralReward"("userId");

-- CreateIndex
CREATE INDEX "ReferralReward_status_idx" ON "ReferralReward"("status");

-- CreateIndex
CREATE INDEX "ReferralReward_rewardType_idx" ON "ReferralReward"("rewardType");

-- CreateIndex
CREATE INDEX "ReferralReward_tier_idx" ON "ReferralReward"("tier");

-- CreateIndex
CREATE INDEX "ReferralReward_createdAt_idx" ON "ReferralReward"("createdAt");

-- CreateIndex
CREATE INDEX "ReferralCampaign_isActive_idx" ON "ReferralCampaign"("isActive");

-- CreateIndex
CREATE INDEX "ReferralCampaign_startDate_endDate_idx" ON "ReferralCampaign"("startDate", "endDate");

-- AddForeignKey
ALTER TABLE "ReferralCode" ADD CONSTRAINT "ReferralCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referralCodeId_fkey" FOREIGN KEY ("referralCodeId") REFERENCES "ReferralCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredId_fkey" FOREIGN KEY ("referredId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_parentReferralId_fkey" FOREIGN KEY ("parentReferralId") REFERENCES "Referral"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
