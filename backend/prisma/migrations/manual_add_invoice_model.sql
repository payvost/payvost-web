-- Manual Migration: Add Invoice Model
-- Run this SQL directly on your database if Prisma migrate fails
-- Generated for: add_invoice_model

-- CreateEnumType: InvoiceType
CREATE TYPE "InvoiceType" AS ENUM ('USER', 'BUSINESS');

-- CreateEnumType: InvoiceStatus
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnumType: PaymentMethod
CREATE TYPE "PaymentMethod" AS ENUM ('PAYVOST', 'MANUAL', 'STRIPE');

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceType" "InvoiceType" NOT NULL DEFAULT 'USER',
    "userId" TEXT NOT NULL,
    "businessId" TEXT,
    "createdBy" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL,
    "grandTotal" DECIMAL(20,8) NOT NULL,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "fromInfo" JSONB NOT NULL,
    "toInfo" JSONB NOT NULL,
    "items" JSONB NOT NULL,
    "notes" TEXT,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'PAYVOST',
    "manualBankDetails" JSONB,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "publicUrl" TEXT,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_userId_idx" ON "Invoice"("userId");

-- CreateIndex
CREATE INDEX "Invoice_businessId_idx" ON "Invoice"("businessId");

-- CreateIndex
CREATE INDEX "Invoice_createdBy_idx" ON "Invoice"("createdBy");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_invoiceType_idx" ON "Invoice"("invoiceType");

-- CreateIndex
CREATE INDEX "Invoice_isPublic_idx" ON "Invoice"("isPublic");

-- CreateIndex
CREATE INDEX "Invoice_invoiceNumber_idx" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_dueDate_idx" ON "Invoice"("dueDate");

