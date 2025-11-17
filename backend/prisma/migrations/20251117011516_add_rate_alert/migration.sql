-- CreateEnum
CREATE TYPE "EscrowStatus" AS ENUM ('DRAFT', 'AWAITING_ACCEPTANCE', 'AWAITING_FUNDING', 'FUNDED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "EscrowPartyRole" AS ENUM ('BUYER', 'SELLER', 'MEDIATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('PENDING', 'AWAITING_FUNDING', 'FUNDED', 'UNDER_REVIEW', 'APPROVED', 'RELEASED', 'DISPUTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'EVIDENCE_SUBMITTED', 'AWAITING_DECISION', 'RESOLVED_BUYER', 'RESOLVED_SELLER', 'RESOLVED_PARTIAL', 'CLOSED');

-- CreateEnum
CREATE TYPE "DisputeResolution" AS ENUM ('REFUND_BUYER', 'RELEASE_SELLER', 'PARTIAL_REFUND', 'CUSTOM_SPLIT');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "twoFactorBackupCodes" TEXT[],
ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorMethod" TEXT,
ADD COLUMN     "twoFactorPhone" TEXT,
ADD COLUMN     "twoFactorSecret" TEXT,
ADD COLUMN     "twoFactorVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Escrow" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "EscrowStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL,
    "totalAmount" DECIMAL(20,8) NOT NULL,
    "platformFee" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "platformFeePercent" DECIMAL(5,2) NOT NULL DEFAULT 2.5,
    "escrowAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "fundedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
    "autoReleaseEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoReleaseDays" INTEGER,

    CONSTRAINT "Escrow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscrowParty" (
    "id" TEXT NOT NULL,
    "escrowId" TEXT NOT NULL,
    "userId" TEXT,
    "role" "EscrowPartyRole" NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "hasAccepted" BOOLEAN NOT NULL DEFAULT false,
    "acceptedAt" TIMESTAMP(3),
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EscrowParty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Milestone" (
    "id" TEXT NOT NULL,
    "escrowId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(20,8) NOT NULL,
    "status" "MilestoneStatus" NOT NULL DEFAULT 'PENDING',
    "amountFunded" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "fundedAt" TIMESTAMP(3),
    "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "deliverableDescription" TEXT,
    "deliverableSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "deliverableUrl" TEXT,
    "deliverableSubmittedAt" TIMESTAMP(3),
    "autoReleaseDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscrowTransaction" (
    "id" TEXT NOT NULL,
    "escrowId" TEXT NOT NULL,
    "milestoneId" TEXT,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(20,8) NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "transferId" TEXT,
    "accountId" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "errorMessage" TEXT,
    "processedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EscrowTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "escrowId" TEXT NOT NULL,
    "raisedBy" TEXT NOT NULL,
    "raisedByRole" "EscrowPartyRole" NOT NULL,
    "againstRole" "EscrowPartyRole",
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "resolution" "DisputeResolution",
    "resolutionNotes" TEXT,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "refundAmount" DECIMAL(20,8),
    "releaseAmount" DECIMAL(20,8),
    "respondByDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisputeEvidence" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisputeEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisputeMessage" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderRole" "EscrowPartyRole" NOT NULL,
    "message" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisputeMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscrowActivity" (
    "id" TEXT NOT NULL,
    "escrowId" TEXT NOT NULL,
    "milestoneId" TEXT,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "performedBy" TEXT,
    "performedByRole" "EscrowPartyRole",
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EscrowActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscrowDocument" (
    "id" TEXT NOT NULL,
    "escrowId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EscrowDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateAlert" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "pushSubscription" JSONB,
    "sourceCurrency" TEXT NOT NULL,
    "targetCurrency" TEXT NOT NULL,
    "targetRate" DECIMAL(30,12) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notifiedAt" TIMESTAMP(3),
    "notifiedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Escrow_status_idx" ON "Escrow"("status");

-- CreateIndex
CREATE INDEX "Escrow_createdAt_idx" ON "Escrow"("createdAt");

-- CreateIndex
CREATE INDEX "EscrowParty_escrowId_idx" ON "EscrowParty"("escrowId");

-- CreateIndex
CREATE INDEX "EscrowParty_userId_idx" ON "EscrowParty"("userId");

-- CreateIndex
CREATE INDEX "EscrowParty_email_idx" ON "EscrowParty"("email");

-- CreateIndex
CREATE INDEX "Milestone_escrowId_idx" ON "Milestone"("escrowId");

-- CreateIndex
CREATE INDEX "Milestone_status_idx" ON "Milestone"("status");

-- CreateIndex
CREATE INDEX "EscrowTransaction_escrowId_idx" ON "EscrowTransaction"("escrowId");

-- CreateIndex
CREATE INDEX "EscrowTransaction_milestoneId_idx" ON "EscrowTransaction"("milestoneId");

-- CreateIndex
CREATE INDEX "EscrowTransaction_type_idx" ON "EscrowTransaction"("type");

-- CreateIndex
CREATE INDEX "EscrowTransaction_status_idx" ON "EscrowTransaction"("status");

-- CreateIndex
CREATE INDEX "Dispute_escrowId_idx" ON "Dispute"("escrowId");

-- CreateIndex
CREATE INDEX "Dispute_status_idx" ON "Dispute"("status");

-- CreateIndex
CREATE INDEX "Dispute_raisedBy_idx" ON "Dispute"("raisedBy");

-- CreateIndex
CREATE INDEX "DisputeEvidence_disputeId_idx" ON "DisputeEvidence"("disputeId");

-- CreateIndex
CREATE INDEX "DisputeMessage_disputeId_idx" ON "DisputeMessage"("disputeId");

-- CreateIndex
CREATE INDEX "EscrowActivity_escrowId_idx" ON "EscrowActivity"("escrowId");

-- CreateIndex
CREATE INDEX "EscrowActivity_createdAt_idx" ON "EscrowActivity"("createdAt");

-- CreateIndex
CREATE INDEX "EscrowDocument_escrowId_idx" ON "EscrowDocument"("escrowId");

-- CreateIndex
CREATE UNIQUE INDEX "RateAlert_email_key" ON "RateAlert"("email");

-- CreateIndex
CREATE INDEX "RateAlert_sourceCurrency_targetCurrency_idx" ON "RateAlert"("sourceCurrency", "targetCurrency");

-- CreateIndex
CREATE INDEX "RateAlert_email_idx" ON "RateAlert"("email");

-- AddForeignKey
ALTER TABLE "EscrowParty" ADD CONSTRAINT "EscrowParty_escrowId_fkey" FOREIGN KEY ("escrowId") REFERENCES "Escrow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_escrowId_fkey" FOREIGN KEY ("escrowId") REFERENCES "Escrow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscrowTransaction" ADD CONSTRAINT "EscrowTransaction_escrowId_fkey" FOREIGN KEY ("escrowId") REFERENCES "Escrow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscrowTransaction" ADD CONSTRAINT "EscrowTransaction_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_escrowId_fkey" FOREIGN KEY ("escrowId") REFERENCES "Escrow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeEvidence" ADD CONSTRAINT "DisputeEvidence_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "Dispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeMessage" ADD CONSTRAINT "DisputeMessage_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "Dispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscrowActivity" ADD CONSTRAINT "EscrowActivity_escrowId_fkey" FOREIGN KEY ("escrowId") REFERENCES "Escrow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscrowActivity" ADD CONSTRAINT "EscrowActivity_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscrowDocument" ADD CONSTRAINT "EscrowDocument_escrowId_fkey" FOREIGN KEY ("escrowId") REFERENCES "Escrow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
