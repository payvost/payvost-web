/**
 * Migration Script: Firestore Invoices → PostgreSQL
 * 
 * This script migrates invoices from Firestore to PostgreSQL.
 * Run this script after the Prisma migration has been applied.
 * 
 * Usage:
 *   npx ts-node backend/services/invoice/migrate-firestore-to-postgres.ts
 */

import { PrismaClient, InvoiceType, InvoiceStatus, PaymentMethod } from '@prisma/client';
import admin from 'firebase-admin';
import { Decimal } from '@prisma/client/runtime/library';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

const prisma = new PrismaClient();
const db = admin.firestore();

interface FirestoreInvoice {
  id: string;
  invoiceNumber?: string;
  userId?: string;
  createdBy?: string;
  businessId?: string;
  issueDate?: any;
  dueDate?: any;
  status?: string;
  currency?: string;
  grandTotal?: number;
  taxRate?: number;
  fromName?: string;
  fromAddress?: string;
  fromEmail?: string;
  toName?: string;
  toEmail?: string;
  toAddress?: string;
  items?: Array<{
    description: string;
    quantity: number;
    price: number;
  }>;
  notes?: string;
  paymentMethod?: string;
  manualBankName?: string;
  manualAccountName?: string;
  manualAccountNumber?: string;
  manualOtherDetails?: string;
  isPublic?: boolean;
  publicUrl?: string;
  createdAt?: any;
  updatedAt?: any;
  paidAt?: any;
}

function convertTimestamp(timestamp: any): Date {
  if (!timestamp) return new Date();
  if (timestamp.toDate) return timestamp.toDate();
  if (timestamp._seconds) return new Date(timestamp._seconds * 1000);
  if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
  if (timestamp instanceof Date) return timestamp;
  return new Date(timestamp);
}

function mapStatus(status: string | undefined): InvoiceStatus {
  const statusMap: Record<string, InvoiceStatus> = {
    'Draft': 'DRAFT',
    'Pending': 'PENDING',
    'Paid': 'PAID',
    'Overdue': 'OVERDUE',
    'Cancelled': 'CANCELLED',
  };
  return statusMap[status || ''] || 'DRAFT';
}

function mapPaymentMethod(method: string | undefined): PaymentMethod {
  const methodMap: Record<string, PaymentMethod> = {
    'payvost': 'PAYVOST',
    'manual': 'MANUAL',
    'stripe': 'STRIPE',
  };
  return methodMap[method || ''] || 'PAYVOST';
}

async function migrateCollection(collectionName: string, invoiceType: InvoiceType) {
  console.log(`\n📦 Migrating ${collectionName} collection...`);
  
  const snapshot = await db.collection(collectionName).get();
  console.log(`Found ${snapshot.size} invoices in ${collectionName}`);

  let successCount = 0;
  let errorCount = 0;
  const errors: Array<{ id: string; error: string }> = [];

  for (const doc of snapshot.docs) {
    try {
      const data = doc.data() as FirestoreInvoice;
      const id = doc.id;

      // Skip if already migrated (check by invoice number or ID)
      const existing = await prisma.invoice.findFirst({
        where: {
          OR: [
            { id },
            { invoiceNumber: data.invoiceNumber || `MIGRATED-${id}` },
          ],
        },
      });

      if (existing) {
        console.log(`⏭️  Skipping ${id} (already exists)`);
        continue;
      }

      // Prepare invoice data
      const invoiceNumber = data.invoiceNumber || `INV-${id.substring(0, 8).toUpperCase()}`;
      const userId = data.userId || data.createdBy || 'unknown';
      const createdBy = data.createdBy || data.userId || 'unknown';

      // Convert dates
      const issueDate = convertTimestamp(data.issueDate);
      const dueDate = convertTimestamp(data.dueDate);
      const createdAt = convertTimestamp(data.createdAt);
      const updatedAt = convertTimestamp(data.updatedAt);
      const paidAt = data.paidAt ? convertTimestamp(data.paidAt) : null;

      // Prepare JSON fields
      const fromInfo = {
        name: data.fromName || 'Unknown',
        address: data.fromAddress || '',
        email: data.fromEmail || '',
      };

      const toInfo = {
        name: data.toName || 'Unknown',
        address: data.toAddress || '',
        email: data.toEmail || '',
      };

      const items = data.items || [];

      const manualBankDetails = data.manualBankName
        ? {
            bankName: data.manualBankName,
            accountName: data.manualAccountName || '',
            accountNumber: data.manualAccountNumber || '',
            otherDetails: data.manualOtherDetails || '',
          }
        : null;

      // Create invoice in PostgreSQL
      await prisma.invoice.create({
        data: {
          id, // Use Firestore ID to maintain references
          invoiceNumber,
          invoiceType,
          userId,
          businessId: data.businessId || null,
          createdBy,
          issueDate,
          dueDate,
          status: mapStatus(data.status),
          currency: data.currency || 'USD',
          grandTotal: new Decimal(data.grandTotal || 0),
          taxRate: new Decimal(data.taxRate || 0),
          fromInfo: fromInfo as any,
          toInfo: toInfo as any,
          items: items as any,
          notes: data.notes || null,
          paymentMethod: mapPaymentMethod(data.paymentMethod),
          manualBankDetails: manualBankDetails as any,
          isPublic: data.isPublic || false,
          publicUrl: data.publicUrl || null,
          createdAt,
          updatedAt,
          paidAt,
        },
      });

      successCount++;
      if (successCount % 10 === 0) {
        console.log(`✅ Migrated ${successCount} invoices...`);
      }
    } catch (error: any) {
      errorCount++;
      const errorMsg = error.message || String(error);
      errors.push({ id: doc.id, error: errorMsg });
      console.error(`❌ Error migrating ${doc.id}:`, errorMsg);
    }
  }

  console.log(`\n✅ Migration complete for ${collectionName}:`);
  console.log(`   Success: ${successCount}`);
  console.log(`   Errors: ${errorCount}`);
  
  if (errors.length > 0) {
    console.log(`\n❌ Errors encountered:`);
    errors.slice(0, 10).forEach(({ id, error }) => {
      console.log(`   ${id}: ${error}`);
    });
    if (errors.length > 10) {
      console.log(`   ... and ${errors.length - 10} more errors`);
    }
  }

  return { successCount, errorCount, errors };
}

async function main() {
  console.log('🚀 Starting Firestore → PostgreSQL Invoice Migration\n');
  console.log('⚠️  This will migrate invoices from Firestore to PostgreSQL');
  console.log('⚠️  Make sure you have:');
  console.log('   1. Applied Prisma migrations');
  console.log('   2. Set up Firebase Admin credentials');
  console.log('   3. Database connection configured\n');

  try {
    // Migrate user invoices
    const userResult = await migrateCollection('invoices', InvoiceType.USER);
    
    // Migrate business invoices
    const businessResult = await migrateCollection('businessInvoices', InvoiceType.BUSINESS);

    console.log('\n📊 Migration Summary:');
    console.log(`   Total Success: ${userResult.successCount + businessResult.successCount}`);
    console.log(`   Total Errors: ${userResult.errorCount + businessResult.errorCount}`);

    if (userResult.errorCount + businessResult.errorCount === 0) {
      console.log('\n✅ All invoices migrated successfully!');
    } else {
      console.log('\n⚠️  Some invoices failed to migrate. Check errors above.');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
if (require.main === module) {
  main();
}

export { migrateCollection };

