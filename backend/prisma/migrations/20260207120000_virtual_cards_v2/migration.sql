-- Virtual Cards v2 (Personal + Business)

-- 1) Account.workspaceId (optional, backfilled later)
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;
CREATE INDEX IF NOT EXISTS "Account_workspaceId_idx" ON "Account"("workspaceId");
ALTER TABLE "Account"
  ADD CONSTRAINT IF NOT EXISTS "Account_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 2) Enums
DO $$ BEGIN
  CREATE TYPE "WorkspaceRole" AS ENUM ('OWNER', 'ADMIN', 'SPEND_MANAGER', 'CARDHOLDER', 'VIEWER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CardStatus" AS ENUM ('ACTIVE', 'FROZEN', 'TERMINATED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CardNetwork" AS ENUM ('VISA', 'MASTERCARD');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CardType" AS ENUM ('VIRTUAL', 'PHYSICAL');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SpendingInterval" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'ALL_TIME');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CardTransactionKind" AS ENUM ('AUTH', 'CLEARING', 'REFUND', 'REVERSAL');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CardTransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'DECLINED', 'REVERSED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 3) WorkspaceMember
CREATE TABLE IF NOT EXISTS "WorkspaceMember" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "WorkspaceRole" NOT NULL DEFAULT 'OWNER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WorkspaceMember_workspaceId_userId_key"
  ON "WorkspaceMember"("workspaceId", "userId");
CREATE INDEX IF NOT EXISTS "WorkspaceMember_userId_idx" ON "WorkspaceMember"("userId");
CREATE INDEX IF NOT EXISTS "WorkspaceMember_workspaceId_idx" ON "WorkspaceMember"("workspaceId");

ALTER TABLE "WorkspaceMember"
  ADD CONSTRAINT IF NOT EXISTS "WorkspaceMember_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceMember"
  ADD CONSTRAINT IF NOT EXISTS "WorkspaceMember_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- 4) Card tables
CREATE TABLE IF NOT EXISTS "Card" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "status" "CardStatus" NOT NULL DEFAULT 'ACTIVE',
  "network" "CardNetwork" NOT NULL,
  "type" "CardType" NOT NULL DEFAULT 'VIRTUAL',
  "currency" TEXT NOT NULL,
  "provider" "ExternalProvider" NOT NULL DEFAULT 'RAPYD',
  "providerCardId" TEXT NOT NULL,
  "last4" TEXT NOT NULL,
  "expMonth" INTEGER,
  "expYear" INTEGER,
  "createdByUserId" TEXT NOT NULL,
  "assignedToUserId" TEXT,
  "idempotencyKey" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Card_provider_providerCardId_key"
  ON "Card"("provider", "providerCardId");
CREATE UNIQUE INDEX IF NOT EXISTS "Card_workspaceId_createdByUserId_idempotencyKey_key"
  ON "Card"("workspaceId", "createdByUserId", "idempotencyKey");
CREATE INDEX IF NOT EXISTS "Card_workspaceId_createdAt_idx" ON "Card"("workspaceId", "createdAt");
CREATE INDEX IF NOT EXISTS "Card_accountId_idx" ON "Card"("accountId");
CREATE INDEX IF NOT EXISTS "Card_assignedToUserId_idx" ON "Card"("assignedToUserId");
CREATE INDEX IF NOT EXISTS "Card_createdByUserId_idx" ON "Card"("createdByUserId");

ALTER TABLE "Card"
  ADD CONSTRAINT IF NOT EXISTS "Card_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Card"
  ADD CONSTRAINT IF NOT EXISTS "Card_accountId_fkey"
  FOREIGN KEY ("accountId") REFERENCES "Account"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Card"
  ADD CONSTRAINT IF NOT EXISTS "Card_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Card"
  ADD CONSTRAINT IF NOT EXISTS "Card_assignedToUserId_fkey"
  FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "CardControl" (
  "id" TEXT NOT NULL,
  "cardId" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "spendLimitAmount" DECIMAL(20,8),
  "spendLimitInterval" "SpendingInterval" NOT NULL DEFAULT 'MONTHLY',
  "allowedCountries" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "blockedCountries" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "allowedMcc" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "blockedMcc" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "merchantAllowlist" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "merchantBlocklist" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "onlineAllowed" BOOLEAN NOT NULL DEFAULT TRUE,
  "atmAllowed" BOOLEAN NOT NULL DEFAULT FALSE,
  "contactlessAllowed" BOOLEAN NOT NULL DEFAULT TRUE,
  "updatedByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CardControl_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CardControl_cardId_version_key" ON "CardControl"("cardId", "version");
CREATE INDEX IF NOT EXISTS "CardControl_cardId_updatedAt_idx" ON "CardControl"("cardId", "updatedAt");

ALTER TABLE "CardControl"
  ADD CONSTRAINT IF NOT EXISTS "CardControl_cardId_fkey"
  FOREIGN KEY ("cardId") REFERENCES "Card"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CardControl"
  ADD CONSTRAINT IF NOT EXISTS "CardControl_updatedByUserId_fkey"
  FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "CardTransaction" (
  "id" TEXT NOT NULL,
  "cardId" TEXT NOT NULL,
  "providerTxId" TEXT NOT NULL,
  "kind" "CardTransactionKind" NOT NULL,
  "amount" DECIMAL(20,8) NOT NULL,
  "currency" TEXT NOT NULL,
  "merchantName" TEXT,
  "merchantCountry" TEXT,
  "mcc" TEXT,
  "status" "CardTransactionStatus" NOT NULL DEFAULT 'PENDING',
  "happenedAt" TIMESTAMP(3) NOT NULL,
  "raw" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CardTransaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CardTransaction_providerTxId_key" ON "CardTransaction"("providerTxId");
CREATE INDEX IF NOT EXISTS "CardTransaction_cardId_happenedAt_idx" ON "CardTransaction"("cardId", "happenedAt");
CREATE INDEX IF NOT EXISTS "CardTransaction_status_happenedAt_idx" ON "CardTransaction"("status", "happenedAt");

ALTER TABLE "CardTransaction"
  ADD CONSTRAINT IF NOT EXISTS "CardTransaction_cardId_fkey"
  FOREIGN KEY ("cardId") REFERENCES "Card"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "CardEvent" (
  "id" TEXT NOT NULL,
  "cardId" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "actorUserId" TEXT,
  "type" TEXT NOT NULL,
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CardEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CardEvent_workspaceId_createdAt_idx" ON "CardEvent"("workspaceId", "createdAt");
CREATE INDEX IF NOT EXISTS "CardEvent_cardId_createdAt_idx" ON "CardEvent"("cardId", "createdAt");

ALTER TABLE "CardEvent"
  ADD CONSTRAINT IF NOT EXISTS "CardEvent_cardId_fkey"
  FOREIGN KEY ("cardId") REFERENCES "Card"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CardEvent"
  ADD CONSTRAINT IF NOT EXISTS "CardEvent_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "CardRevealAudit" (
  "id" TEXT NOT NULL,
  "cardId" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CardRevealAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CardRevealAudit_cardId_createdAt_idx" ON "CardRevealAudit"("cardId", "createdAt");
CREATE INDEX IF NOT EXISTS "CardRevealAudit_actorUserId_createdAt_idx" ON "CardRevealAudit"("actorUserId", "createdAt");

ALTER TABLE "CardRevealAudit"
  ADD CONSTRAINT IF NOT EXISTS "CardRevealAudit_cardId_fkey"
  FOREIGN KEY ("cardId") REFERENCES "Card"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

