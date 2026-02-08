import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '@/lib/firebase-admin';
import { requireAuth, HttpError } from '@/lib/api/auth';
import { isValidPinFormat, isWeakPin } from '@/lib/security/pin-policy';
import {
  computeTransactionPinVerifier,
  generateSaltBase64,
  readPinLockState,
  registerPinFailure,
  registerPinSuccess,
  requireTransactionPinPepper,
  safeEqualBase64,
} from '@/lib/security/transaction-pin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/security/pin/change
 * Body: { currentPin: "1234", newPin: "5678" }
 */
export async function POST(request: NextRequest) {
  try {
    const { uid } = await requireAuth(request);
    const body = (await request.json().catch(() => null)) as { currentPin?: unknown; newPin?: unknown } | null;
    const currentPin = typeof body?.currentPin === 'string' ? body.currentPin : '';
    const newPin = typeof body?.newPin === 'string' ? body.newPin : '';

    if (!isValidPinFormat(currentPin) || !isValidPinFormat(newPin)) {
      return NextResponse.json({ error: 'PINs must be exactly 4 digits' }, { status: 400 });
    }
    if (currentPin === newPin) {
      return NextResponse.json({ error: 'New PIN must be different' }, { status: 400 });
    }
    if (isWeakPin(newPin)) {
      return NextResponse.json({ error: 'This PIN is too common or predictable' }, { status: 400 });
    }

    const pepper = requireTransactionPinPepper();
    const ref = db.collection('userSecrets').doc(uid);
    const now = new Date();

    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const transactionPin = snap.exists ? (snap.data() as any)?.transactionPin : null;
      if (!transactionPin?.verifier || !transactionPin?.salt) {
        throw new HttpError(404, 'PIN not set');
      }

      const lock = readPinLockState(transactionPin, now);
      if (lock.lockedUntilMs) {
        return {
          status: 423,
          body: { error: 'PIN temporarily locked', lockedUntil: new Date(lock.lockedUntilMs).toISOString() },
        };
      }

      const expected = computeTransactionPinVerifier({
        uid,
        saltB64: transactionPin.salt,
        pin: currentPin,
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
            error: failure.lockedUntil ? 'PIN temporarily locked' : 'Invalid PIN',
            lockedUntil: failure.lockedUntil ? failure.lockedUntil.toISOString() : null,
          },
        };
      }

      // Rotate salt on change.
      const salt = generateSaltBase64(16);
      const verifier = computeTransactionPinVerifier({ uid, saltB64: salt, pin: newPin, pepper });

      tx.set(
        ref,
        {
          transactionPin: {
            version: 1,
            salt,
            verifier,
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
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('PIN change error:', error);
    return NextResponse.json({ error: 'Failed to change PIN' }, { status: 500 });
  }
}

