import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '@/lib/firebase-admin';
import { requireAuth, HttpError } from '@/lib/api/auth';
import { isValidPinFormat } from '@/lib/security/pin-policy';
import {
  computeTransactionPinVerifier,
  readPinLockState,
  registerPinFailure,
  registerPinSuccess,
  requireTransactionPinPepper,
  safeEqualBase64,
} from '@/lib/security/transaction-pin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/security/pin/verify
 * Body: { pin: "1234" }
 */
export async function POST(request: NextRequest) {
  try {
    const { uid } = await requireAuth(request);
    const body = (await request.json().catch(() => null)) as { pin?: unknown } | null;
    const pin = typeof body?.pin === 'string' ? body.pin : '';

    if (!isValidPinFormat(pin)) {
      return NextResponse.json({ ok: false, error: 'PIN must be exactly 4 digits' }, { status: 400 });
    }

    const pepper = requireTransactionPinPepper();
    const ref = db.collection('userSecrets').doc(uid);
    const now = new Date();

    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const transactionPin = snap.exists ? (snap.data() as any)?.transactionPin : null;
      if (!transactionPin?.verifier || !transactionPin?.salt) {
        return { status: 404, body: { ok: false, error: 'PIN not set' } };
      }

      const lock = readPinLockState(transactionPin, now);
      if (lock.lockedUntilMs) {
        return {
          status: 423,
          body: { ok: false, error: 'PIN temporarily locked', lockedUntil: new Date(lock.lockedUntilMs).toISOString() },
        };
      }

      const expected = computeTransactionPinVerifier({
        uid,
        saltB64: transactionPin.salt,
        pin,
        pepper,
      });
      const ok = safeEqualBase64(expected, transactionPin.verifier);

      if (!ok) {
        const failure = registerPinFailure(lock, now);
        tx.set(
          ref,
          {
            transactionPin: {
              failedAttempts: failure.failedAttempts,
              lockedUntil: failure.lockedUntil,
              lastFailedAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            },
          },
          { merge: true }
        );

        return {
          status: failure.lockedUntil ? 423 : 401,
          body: {
            ok: false,
            error: failure.lockedUntil ? 'PIN temporarily locked' : 'Invalid PIN',
            lockedUntil: failure.lockedUntil ? failure.lockedUntil.toISOString() : null,
          },
        };
      }

      tx.set(
        ref,
        {
          transactionPin: {
            ...registerPinSuccess(),
            updatedAt: FieldValue.serverTimestamp(),
          },
        },
        { merge: true }
      );

      return { status: 200, body: { ok: true } };
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (error: any) {
    if (error instanceof HttpError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    console.error('PIN verify error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to verify PIN' }, { status: 500 });
  }
}

