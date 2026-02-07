import { describe, expect, it } from 'vitest';
import { computeCapabilities } from './capabilities';

describe('computeCapabilities', () => {
  it('enables payment actions when kyc is verified', () => {
    const caps = computeCapabilities({ kycStatus: 'verified' });
    expect(caps['payments.send'].enabled).toBe(true);
    expect(caps['payments.request'].enabled).toBe(true);
    expect(caps['payments.bills'].enabled).toBe(true);
  });

  it('disables sensitive actions when kyc is not verified', () => {
    const caps = computeCapabilities({ kycStatus: 'unverified' });
    expect(caps['payments.send'].enabled).toBe(false);
    expect(caps['payments.send'].reason).toBeTruthy();
    expect(caps['payments.methods'].enabled).toBe(true);
  });

  it('disables everything when account is restricted', () => {
    const caps = computeCapabilities({ kycStatus: 'verified', accountRestricted: true });
    expect(Object.values(caps).every((c) => c.enabled === false)).toBe(true);
  });

  it('respects feature flags', () => {
    const caps = computeCapabilities({ kycStatus: 'verified', featureFlags: { 'payments.bills': false } });
    expect(caps['payments.bills'].enabled).toBe(false);
    expect(caps['payments.bills'].reason).toBeTruthy();
  });
});

