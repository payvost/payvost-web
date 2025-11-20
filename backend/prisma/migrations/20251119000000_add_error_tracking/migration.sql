-- CreateEnum
CREATE TYPE "ErrorSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ErrorStatus" AS ENUM ('NEW', 'ACKNOWLEDGED', 'RESOLVED', 'IGNORED');

-- CreateTable
CREATE TABLE "ErrorLog" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "errorType" TEXT NOT NULL,
    "severity" "ErrorSeverity" NOT NULL DEFAULT 'MEDIUM',
    "status" "ErrorStatus" NOT NULL DEFAULT 'NEW',
    "stack" TEXT,
    "context" JSONB,
    "method" TEXT,
    "path" TEXT,
    "query" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT,
    "correlationId" TEXT,
    "environment" TEXT NOT NULL DEFAULT 'development',
    "release" TEXT,
    "occurrenceCount" INTEGER NOT NULL DEFAULT 1,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ErrorLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ErrorLog_severity_idx" ON "ErrorLog"("severity");

-- CreateIndex
CREATE INDEX "ErrorLog_status_idx" ON "ErrorLog"("status");

-- CreateIndex
CREATE INDEX "ErrorLog_errorType_idx" ON "ErrorLog"("errorType");

-- CreateIndex
CREATE INDEX "ErrorLog_userId_idx" ON "ErrorLog"("userId");

-- CreateIndex
CREATE INDEX "ErrorLog_createdAt_idx" ON "ErrorLog"("createdAt");

-- CreateIndex
CREATE INDEX "ErrorLog_correlationId_idx" ON "ErrorLog"("correlationId");

