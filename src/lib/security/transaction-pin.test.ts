import { describe, expect, it } from 'vitest';
import {
  computeTransactionPinVerifier,
  PIN_LOCKOUT_MAX_ATTEMPTS,
  PIN_LOCKOUT_MINUTES,
  readPinLockState,
  registerPinFailure,
  registerPinSuccess,
  safeEqualBase64,
} from './transaction-pin';

describe('transaction-pin', () => {
  it('computes a stable verifier for same inputs', () => {
    const pepper = 'test-pepper';
    const uid = 'uid_123';
    const salt = 'salt_b64';
    const pin = '1234';
    const a = computeTransactionPinVerifier({ uid, saltB64: salt, pin, pepper });
    const b = computeTransactionPinVerifier({ uid, saltB64: salt, pin, pepper });
    expect(a).toBe(b);
    expect(safeEqualBase64(a, b)).toBe(true);
  });

  it('changes verifier when salt or pin changes', () => {
    const pepper = 'test-pepper';
    const uid = 'uid_123';
    const a = computeTransactionPinVerifier({ uid, saltB64: 'salt1', pin: '1234', pepper });
    const b = computeTransactionPinVerifier({ uid, saltB64: 'salt2', pin: '1234', pepper });
    const c = computeTransactionPinVerifier({ uid, saltB64: 'salt1', pin: '5678', pepper });
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
    expect(safeEqualBase64(a, b)).toBe(false);
  });

  it('locks out after max failures', () => {
    const now = new Date('2026-02-08T00:00:00.000Z');
    let state = { failedAttempts: 0, lockedUntilMs: null as number | null };
    let lockedUntil: Date | null = null;

    for (let i = 0; i < PIN_LOCKOUT_MAX_ATTEMPTS; i++) {
      const next = registerPinFailure(state, now);
      state = { failedAttempts: next.failedAttempts, lockedUntilMs: next.lockedUntil ? next.lockedUntil.getTime() : null };
      lockedUntil = next.lockedUntil;
    }

    expect(state.failedAttempts).toBe(PIN_LOCKOUT_MAX_ATTEMPTS);
    expect(lockedUntil).not.toBeNull();
    expect(lockedUntil!.getTime() - now.getTime()).toBe(PIN_LOCKOUT_MINUTES * 60 * 1000);
  });

  it('readPinLockState returns active lock when lockedUntil is in the future', () => {
    const now = new Date('2026-02-08T00:00:00.000Z');
    const future = new Date(now.getTime() + 60_000);
    const state = readPinLockState({ failedAttempts: 3, lockedUntil: future }, now);
    expect(state.failedAttempts).toBe(3);
    expect(state.lockedUntilMs).toBe(future.getTime());
  });

  it('registerPinSuccess resets counters', () => {
    const s = registerPinSuccess();
    expect(s.failedAttempts).toBe(0);
    expect(s.lockedUntil).toBeNull();
    expect(s.lastFailedAt).toBeNull();
  });
});

