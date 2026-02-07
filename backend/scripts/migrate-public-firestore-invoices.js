/* eslint-disable no-console */
/**
 * One-time helper to migrate legacy Firestore "public invoices" into Postgres
 * and generate token-based public links.
 *
 * This does NOT delete Firestore data.
 *
 * Usage:
 *   cd backend
 *   node scripts/migrate-public-firestore-invoices.js
 */

require('dotenv').config();

// Initialize Firebase Admin and Prisma (shared backend singletons)
require('../firebase');
const admin = require('firebase-admin');
const { prisma } = require('../common/prisma');
const { InvoiceV1Service } = require('../services/invoice/src/invoice-v1-service');

async function main() {
  if (!admin.apps.length) {
    throw new Error('Firebase Admin is not initialized. Check FIREBASE_SERVICE_ACCOUNT_KEY env.');
  }

  const db = admin.firestore();
  const svc = new InvoiceV1Service(prisma);

  let migrated = 0;
  let scanned = 0;

  // Personal invoices: isPublic == true
  const publicInvoicesSnap = await db.collection('invoices').where('isPublic', '==', true).get();
  console.log(`[migrate] Found ${publicInvoicesSnap.size} public invoices in Firestore (invoices).`);

  for (const doc of publicInvoicesSnap.docs) {
    scanned += 1;
    const legacyId = doc.id;
    const resolved = await svc.resolveLegacyToToken(legacyId).catch(() => null);
    if (resolved) migrated += 1;
  }

  // Business invoices: isPublic == true (created by UI when status != Draft)
  const publicBizSnap = await db.collection('businessInvoices').where('isPublic', '==', true).get();
  console.log(`[migrate] Found ${publicBizSnap.size} public invoices in Firestore (businessInvoices).`);

  for (const doc of publicBizSnap.docs) {
    scanned += 1;
    const legacyId = doc.id;
    const resolved = await svc.resolveLegacyToToken(legacyId).catch(() => null);
    if (resolved) migrated += 1;
  }

  console.log(`[migrate] Done. Scanned: ${scanned}, migrated (token links available): ${migrated}.`);
}

main()
  .catch((err) => {
    console.error('[migrate] Failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => {});
  });

