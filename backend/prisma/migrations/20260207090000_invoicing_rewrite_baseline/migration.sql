-- Invoicing Rewrite: Global-Standard Baseline
-- Adds workspace + invoice series + token-based public links + audit events
-- and extends Invoice for immutable lifecycle operations.

-- WorkspaceType enum
DO $$ BEGIN
  CREATE TYPE "WorkspaceType" AS ENUM ('PERSONAL', 'BUSINESS');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- InvoiceKind enum
DO $$ BEGIN
  CREATE TYPE "InvoiceKind" AS ENUM ('INVOICE', 'CREDIT_NOTE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- InvoiceLegacySource enum
DO $$ BEGIN
  CREATE TYPE "InvoiceLegacySource" AS ENUM ('FIRESTORE_INVOICES', 'FIRESTORE_BUSINESS_INVOICES', 'NATIVE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- InvoiceEventType enum
DO $$ BEGIN
  CREATE TYPE "InvoiceEventType" AS ENUM (
    'INVOICE_CREATED',
    'INVOICE_ISSUED',
    'INVOICE_SENT',
    'INVOICE_VIEWED',
    'PAYMENT_APPLIED',
    'INVOICE_VOIDED',
    'CREDIT_NOTE_ISSUED',
    'PDF_RENDERED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Extend InvoiceStatus enum with new lifecycle statuses (non-breaking).
DO $$ BEGIN
  ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'ISSUED';
  ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'SENT';
  ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'VIEWED';
  ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'PARTIALLY_PAID';
  ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'VOID';
  ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'CREDITED';
EXCEPTION
  WHEN undefined_object THEN
    -- If InvoiceStatus doesn't exist, don't fail the entire migration.
    null;
END $$;

-- Workspace table
CREATE TABLE IF NOT EXISTS "Workspace" (
  "id" TEXT NOT NULL,
  "type" "WorkspaceType" NOT NULL,
  "ownerUserId" TEXT NOT NULL,
  "businessId" TEXT NOT NULL DEFAULT '',
  "name" TEXT NOT NULL,
  "defaultCurrency" TEXT NOT NULL DEFAULT 'USD',
  "defaultLocale" TEXT NOT NULL DEFAULT 'en-US',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- Uniqueness for workspace identity (one personal per user; one business per user+businessId)
CREATE UNIQUE INDEX IF NOT EXISTS "Workspace_type_ownerUserId_businessId_key"
  ON "Workspace"("type", "ownerUserId", "businessId");

CREATE INDEX IF NOT EXISTS "Workspace_ownerUserId_idx" ON "Workspace"("ownerUserId");
CREATE INDEX IF NOT EXISTS "Workspace_businessId_idx" ON "Workspace"("businessId");

-- InvoiceSeries table
CREATE TABLE IF NOT EXISTS "InvoiceSeries" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "prefix" TEXT NOT NULL DEFAULT 'INV-',
  "padding" INTEGER NOT NULL DEFAULT 6,
  "nextNumber" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "InvoiceSeries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InvoiceSeries_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "InvoiceSeries_workspaceId_key" ON "InvoiceSeries"("workspaceId");
CREATE INDEX IF NOT EXISTS "InvoiceSeries_workspaceId_idx" ON "InvoiceSeries"("workspaceId");

-- InvoicePublicLink table
CREATE TABLE IF NOT EXISTS "InvoicePublicLink" (
  "id" TEXT NOT NULL,
  "invoiceId" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "lastViewedAt" TIMESTAMP(3),
  "viewCount" INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT "InvoicePublicLink_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InvoicePublicLink_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "InvoicePublicLink_invoiceId_key" ON "InvoicePublicLink"("invoiceId");
CREATE UNIQUE INDEX IF NOT EXISTS "InvoicePublicLink_token_key" ON "InvoicePublicLink"("token");
CREATE INDEX IF NOT EXISTS "InvoicePublicLink_token_idx" ON "InvoicePublicLink"("token");
CREATE INDEX IF NOT EXISTS "InvoicePublicLink_revokedAt_idx" ON "InvoicePublicLink"("revokedAt");

-- InvoiceEvent table
CREATE TABLE IF NOT EXISTS "InvoiceEvent" (
  "id" TEXT NOT NULL,
  "invoiceId" TEXT NOT NULL,
  "actorUserId" TEXT,
  "type" "InvoiceEventType" NOT NULL,
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "InvoiceEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InvoiceEvent_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "InvoiceEvent_invoiceId_idx" ON "InvoiceEvent"("invoiceId");
CREATE INDEX IF NOT EXISTS "InvoiceEvent_createdAt_idx" ON "InvoiceEvent"("createdAt");
CREATE INDEX IF NOT EXISTS "InvoiceEvent_type_idx" ON "InvoiceEvent"("type");

-- InvoicePayment table
CREATE TABLE IF NOT EXISTS "InvoicePayment" (
  "id" TEXT NOT NULL,
  "invoiceId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerRef" TEXT,
  "idempotencyKey" TEXT,
  "amount" DECIMAL(20,8) NOT NULL,
  "currency" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "InvoicePayment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InvoicePayment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "InvoicePayment_invoiceId_idx" ON "InvoicePayment"("invoiceId");
CREATE INDEX IF NOT EXISTS "InvoicePayment_provider_idx" ON "InvoicePayment"("provider");
CREATE INDEX IF NOT EXISTS "InvoicePayment_providerRef_idx" ON "InvoicePayment"("providerRef");
CREATE INDEX IF NOT EXISTS "InvoicePayment_idempotencyKey_idx" ON "InvoicePayment"("idempotencyKey");

-- Extend Invoice table (best-effort, non-destructive).
ALTER TABLE "Invoice"
  ADD COLUMN IF NOT EXISTS "kind" "InvoiceKind" NOT NULL DEFAULT 'INVOICE',
  ADD COLUMN IF NOT EXISTS "workspaceId" TEXT,
  ADD COLUMN IF NOT EXISTS "amountPaid" DECIMAL(20,8) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "issuedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "sentAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "viewedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "voidedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "voidReason" TEXT,
  ADD COLUMN IF NOT EXISTS "legacySource" "InvoiceLegacySource",
  ADD COLUMN IF NOT EXISTS "legacyId" TEXT,
  ADD COLUMN IF NOT EXISTS "creditNoteForId" TEXT;

-- Workspace FK
DO $$ BEGIN
  ALTER TABLE "Invoice"
    ADD CONSTRAINT "Invoice_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Credit-note self FK
DO $$ BEGIN
  ALTER TABLE "Invoice"
    ADD CONSTRAINT "Invoice_creditNoteForId_fkey" FOREIGN KEY ("creditNoteForId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Legacy id uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_legacyId_key" ON "Invoice"("legacyId");

-- Helpful indexes
CREATE INDEX IF NOT EXISTS "Invoice_workspaceId_idx" ON "Invoice"("workspaceId");
CREATE INDEX IF NOT EXISTS "Invoice_issuedAt_idx" ON "Invoice"("issuedAt");
CREATE INDEX IF NOT EXISTS "Invoice_legacySource_idx" ON "Invoice"("legacySource");
