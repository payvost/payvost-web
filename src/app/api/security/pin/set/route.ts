import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '@/lib/firebase-admin';
import { requireAuth, HttpError } from '@/lib/api/auth';
import { isValidPinFormat, isWeakPin } from '@/lib/security/pin-policy';
import {
  computeTransactionPinVerifier,
  generateSaltBase64,
  requireTransactionPinPepper,
} from '@/lib/security/transaction-pin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/security/pin/set
 * Body: { pin: "1234" }
 */
export async function POST(request: NextRequest) {
  try {
    const { uid } = await requireAuth(request);
    const body = (await request.json().catch(() => null)) as { pin?: unknown } | null;
    const pin = typeof body?.pin === 'string' ? body.pin : '';

    if (!isValidPinFormat(pin)) {
      return NextResponse.json({ error: 'PIN must be exactly 4 digits' }, { status: 400 });
    }
    if (isWeakPin(pin)) {
      return NextResponse.json({ error: 'This PIN is too common or predictable' }, { status: 400 });
    }

    const pepper = requireTransactionPinPepper();
    const ref = db.collection('userSecrets').doc(uid);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const existing = snap.exists ? (snap.data() as any)?.transactionPin : null;
      if (existing?.verifier && existing?.salt) {
        throw new HttpError(409, 'PIN already set');
      }

      const salt = generateSaltBase64(16);
      const verifier = computeTransactionPinVerifier({ uid, saltB64: salt, pin, pepper });

      tx.set(
        ref,
        {
          transactionPin: {
            version: 1,
            salt,
            verifier,
            failedAttempts: 0,
            lockedUntil: null,
            lastFailedAt: null,
            setAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          },
        },
        { merge: true }
      );
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('PIN set error:', error);
    return NextResponse.json({ error: 'Failed to set PIN' }, { status: 500 });
  }
}

