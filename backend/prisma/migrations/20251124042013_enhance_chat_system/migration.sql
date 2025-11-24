/*
  Warnings:

  - Added the required column `updatedAt` to the `ChatMessage` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ChatEventType" AS ENUM ('PAGE_VISIT', 'WIDGET_OPENED', 'MESSAGE_SENT', 'MESSAGE_RECEIVED', 'SESSION_STARTED', 'SESSION_ENDED', 'AGENT_ASSIGNED', 'ESCALATED', 'RATED');

-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('OPERATIONAL', 'DEGRADED_PERFORMANCE', 'MAJOR_OUTAGE');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('INVESTIGATING', 'MONITORING', 'RESOLVED');

-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterTable
ALTER TABLE "ChatMessage" ADD COLUMN     "attachments" JSONB,
ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "reactions" JSONB,
ADD COLUMN     "readAt" TIMESTAMP(3),
ADD COLUMN     "readBy" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "ChatSession" ADD COLUMN     "customerMetadata" JSONB,
ADD COLUMN     "firstResponseAt" TIMESTAMP(3),
ADD COLUMN     "lastMessageAt" TIMESTAMP(3),
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "priority" TEXT DEFAULT 'NORMAL',
ADD COLUMN     "rating" INTEGER,
ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "ChatEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "eventType" "ChatEventType" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedReply" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT,
    "createdBy" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceHealthCheck" (
    "id" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "status" "ServiceStatus" NOT NULL,
    "responseTime" INTEGER,
    "uptime" DECIMAL(5,2),
    "lastChecked" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceHealthCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemIncident" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'INVESTIGATING',
    "severity" "IncidentSeverity" NOT NULL DEFAULT 'MEDIUM',
    "affectedServices" TEXT[],
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemIncident_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatEvent_sessionId_idx" ON "ChatEvent"("sessionId");

-- CreateIndex
CREATE INDEX "ChatEvent_eventType_idx" ON "ChatEvent"("eventType");

-- CreateIndex
CREATE INDEX "ChatEvent_createdAt_idx" ON "ChatEvent"("createdAt");

-- CreateIndex
CREATE INDEX "SavedReply_createdBy_idx" ON "SavedReply"("createdBy");

-- CreateIndex
CREATE INDEX "SavedReply_category_idx" ON "SavedReply"("category");

-- CreateIndex
CREATE INDEX "ServiceHealthCheck_serviceName_idx" ON "ServiceHealthCheck"("serviceName");

-- CreateIndex
CREATE INDEX "ServiceHealthCheck_status_idx" ON "ServiceHealthCheck"("status");

-- CreateIndex
CREATE INDEX "ServiceHealthCheck_lastChecked_idx" ON "ServiceHealthCheck"("lastChecked");

-- CreateIndex
CREATE INDEX "ServiceHealthCheck_serviceName_lastChecked_idx" ON "ServiceHealthCheck"("serviceName", "lastChecked");

-- CreateIndex
CREATE INDEX "SystemIncident_status_idx" ON "SystemIncident"("status");

-- CreateIndex
CREATE INDEX "SystemIncident_severity_idx" ON "SystemIncident"("severity");

-- CreateIndex
CREATE INDEX "SystemIncident_startedAt_idx" ON "SystemIncident"("startedAt");

-- CreateIndex
CREATE INDEX "SystemIncident_status_severity_idx" ON "SystemIncident"("status", "severity");

-- CreateIndex
CREATE INDEX "ChatMessage_senderId_idx" ON "ChatMessage"("senderId");

-- CreateIndex
CREATE INDEX "ChatMessage_isRead_idx" ON "ChatMessage"("isRead");

-- CreateIndex
CREATE INDEX "ChatMessage_type_idx" ON "ChatMessage"("type");

-- CreateIndex
CREATE INDEX "ChatSession_priority_idx" ON "ChatSession"("priority");

-- CreateIndex
CREATE INDEX "ChatSession_lastMessageAt_idx" ON "ChatSession"("lastMessageAt");

-- CreateIndex
CREATE INDEX "ChatSession_tags_idx" ON "ChatSession"("tags");

-- AddForeignKey
ALTER TABLE "ChatEvent" ADD CONSTRAINT "ChatEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
