import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { requireAuth, HttpError } from '@/lib/api/auth';
import { readPinLockState } from '@/lib/security/transaction-pin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/security/pin/status
 * Returns whether the current user has a transaction PIN configured, and lockout status.
 */
export async function GET(request: NextRequest) {
  try {
    const { uid } = await requireAuth(request);

    const snap = await db.collection('userSecrets').doc(uid).get();
    const transactionPin = snap.exists ? (snap.data() as any)?.transactionPin : null;
    const hasPin = Boolean(transactionPin?.verifier && transactionPin?.salt);

    const { lockedUntilMs } = readPinLockState(transactionPin, new Date());
    return NextResponse.json({
      hasPin,
      lockedUntil: lockedUntilMs ? new Date(lockedUntilMs).toISOString() : null,
    });
  } catch (error: any) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('PIN status error:', error);
    return NextResponse.json({ error: 'Failed to load PIN status' }, { status: 500 });
  }
}

