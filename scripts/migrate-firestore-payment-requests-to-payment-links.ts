/**
 * One-time migration: Firestore `paymentRequests` -> Postgres `PaymentLink`.
 *
 * This script is intentionally not auto-run. It requires:
 * - DATABASE_URL (Postgres)
 * - FIREBASE_SERVICE_ACCOUNT_KEY (JSON string) OR GOOGLE_APPLICATION_CREDENTIALS
 *
 * It generates new tokenized URLs (token stored hashed in DB) and writes a mapping report to disk.
 *
 * Usage:
 *   node --loader tsx scripts/migrate-firestore-payment-requests-to-payment-links.ts
 */

import fs from 'fs';
import crypto from 'crypto';
import admin from 'firebase-admin';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function initFirebaseAdmin() {
  if (admin.apps.length) return;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    return;
  }

  // Fallback: GOOGLE_APPLICATION_CREDENTIALS or default credentials in environment.
  admin.initializeApp();
}

function firstFrontendOrigin(): string {
  const raw = process.env.FRONTEND_URL || process.env.PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL || '';
  const origin = raw.split(',').map(s => s.trim()).filter(Boolean)[0] || 'https://www.payvost.com';
  return origin.replace(/\/$/, '');
}

function randomToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

function tokenHash(token: string): string {
  return crypto.createHash('sha256').update(token).digest('base64');
}

function randomPublicId(): string {
  return `pl_${crypto.randomBytes(8).toString('base64url')}`;
}

async function main() {
  initFirebaseAdmin();
  const db = admin.firestore();

  const origin = firstFrontendOrigin();
  const report: any[] = [];

  const snapshot = await db.collection('paymentRequests').get();
  console.log(`[migrate] Found ${snapshot.size} paymentRequests`);

  for (const docSnap of snapshot.docs) {
    const legacyId = docSnap.id;
    const data = docSnap.data() || {};

    const userId = String(data.userId || '').trim();
    if (!userId) {
      report.push({ legacyId, skipped: true, reason: 'missing userId' });
      continue;
    }

    const currency = String(data.currency || 'USD').toUpperCase();
    const linkType = String(data.linkType || 'one-time') === 'reusable' ? 'REUSABLE' : 'ONE_TIME';
    const numericAmount = Number(data.numericAmount ?? 0);
    const amount = Number.isFinite(numericAmount) && numericAmount > 0 ? numericAmount : null;

    const title = String(data.description || data.title || 'Payment Request').slice(0, 200);
    const description = String(data.description || '').slice(0, 2000) || null;

    const statusRaw = String(data.status || 'Active').toLowerCase();
    const isPaid = statusRaw === 'paid' || statusRaw === 'completed' || Boolean(data.used);

    const publicToken = randomToken();
    const publicTokenHash = tokenHash(publicToken);

    // Retry on publicId collisions.
    let publicId = randomPublicId();
    let created: any = null;
    for (let i = 0; i < 5; i++) {
      try {
        created = await (prisma as any).paymentLink.create({
          data: {
            publicId,
            publicTokenHash,
            createdByUserId: userId,
            title,
            description,
            linkType: linkType as any,
            amountType: 'FIXED' as any,
            amount: amount !== null ? String(amount) : '0',
            currency,
            status: isPaid ? ('DISABLED' as any) : ('ACTIVE' as any),
            fulfilledAt: isPaid ? new Date() : null,
            metadata: {
              legacyFirestoreId: legacyId,
              legacyLink: data.link || null,
            },
          },
        });
        break;
      } catch (e) {
        publicId = randomPublicId();
        if (i === 4) throw e;
      }
    }

    const url = `${origin}/pay/${created.publicId}?t=${encodeURIComponent(publicToken)}`;
    report.push({
      legacyId,
      newId: created.id,
      publicId: created.publicId,
      url,
      createdByUserId: userId,
      paid: isPaid,
    });
  }

  const outPath = `migration-report-payment-links-${Date.now()}.json`;
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`[migrate] Wrote report: ${outPath}`);
}

main()
  .catch((e) => {
    console.error('[migrate] Failed:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
