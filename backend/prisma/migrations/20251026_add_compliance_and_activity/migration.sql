-- Add Account Type
ALTER TABLE "Account" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'PERSONAL';

-- Add User Country and Tier
ALTER TABLE "User" ADD COLUMN "country" TEXT;
ALTER TABLE "User" ADD COLUMN "userTier" TEXT NOT NULL DEFAULT 'STANDARD';

-- Create ComplianceAlert table
CREATE TABLE "ComplianceAlert" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
  "type" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "accountId" TEXT,
  "description" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

-- Create AccountActivity table
CREATE TABLE "AccountActivity" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
  "accountId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "ipAddress" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("accountId") REFERENCES "Account"("id"),
  FOREIGN KEY ("userId") REFERENCES "User"("id")
);

-- Create indexes
CREATE INDEX "AccountActivity_accountId_idx" ON "AccountActivity"("accountId");
CREATE INDEX "AccountActivity_userId_idx" ON "AccountActivity"("userId");