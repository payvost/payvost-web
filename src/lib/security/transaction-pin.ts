import crypto from 'node:crypto';

export const PIN_LOCKOUT_MAX_ATTEMPTS = 5;
export const PIN_LOCKOUT_MINUTES = 15;

export type PinLockState = {
  failedAttempts: number;
  lockedUntilMs: number | null;
};

function toMillis(value: unknown): number | null {
  if (!value) return null;
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  if (typeof (value as any).toDate === 'function') return (value as any).toDate().getTime();
  if (typeof (value as any)._seconds === 'number') return (value as any)._seconds * 1000;
  return null;
}

export function requireTransactionPinPepper(): string {
  const pepper = process.env.TRANSACTION_PIN_PEPPER;
  if (!pepper) {
    throw new Error('Missing TRANSACTION_PIN_PEPPER env var');
  }
  return pepper;
}

export function generateSaltBase64(bytes = 16): string {
  return crypto.randomBytes(bytes).toString('base64');
}

export function computeTransactionPinVerifier(params: {
  uid: string;
  saltB64: string;
  pin: string;
  pepper: string;
}): string {
  const message = `${params.uid}:${params.saltB64}:${params.pin}`;
  return crypto.createHmac('sha256', params.pepper).update(message, 'utf8').digest('base64');
}

export function safeEqualBase64(aB64: string, bB64: string): boolean {
  try {
    const a = Buffer.from(aB64, 'base64');
    const b = Buffer.from(bB64, 'base64');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function readPinLockState(pinRecord: any, now = new Date()): PinLockState {
  const failedAttempts = typeof pinRecord?.failedAttempts === 'number' ? pinRecord.failedAttempts : 0;
  const lockedUntilMs = toMillis(pinRecord?.lockedUntil);
  const effectiveLockedUntilMs = lockedUntilMs && lockedUntilMs > now.getTime() ? lockedUntilMs : null;
  return { failedAttempts, lockedUntilMs: effectiveLockedUntilMs };
}

export function registerPinFailure(state: PinLockState, now = new Date()): {
  failedAttempts: number;
  lockedUntil: Date | null;
} {
  const nextAttempts = (state.failedAttempts || 0) + 1;
  if (nextAttempts >= PIN_LOCKOUT_MAX_ATTEMPTS) {
    const lockedUntil = new Date(now.getTime() + PIN_LOCKOUT_MINUTES * 60 * 1000);
    return { failedAttempts: nextAttempts, lockedUntil };
  }
  return { failedAttempts: nextAttempts, lockedUntil: null };
}

export function registerPinSuccess(): {
  failedAttempts: number;
  lockedUntil: null;
  lastFailedAt: null;
} {
  return { failedAttempts: 0, lockedUntil: null, lastFailedAt: null };
}

