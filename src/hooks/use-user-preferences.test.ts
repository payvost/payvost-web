import { describe, expect, it } from 'vitest';
import { buildPreferencesUpdate, DEFAULT_USER_PREFERENCES, normalizeUserPreferences } from '@/lib/user-preferences';

describe('normalizeUserPreferences', () => {
  it('returns defaults for undefined', () => {
    expect(normalizeUserPreferences(undefined)).toEqual(DEFAULT_USER_PREFERENCES);
  });

  it('normalizes language, timezone, fontScale, and highContrast', () => {
    const prefs = normalizeUserPreferences({
      language: 'fr',
      timezone: 'UTC',
      fontScale: 1.1,
      highContrast: true,
    });
    expect(prefs.language).toBe('fr');
    expect(prefs.timezone).toBe('UTC');
    expect(prefs.fontScale).toBe(1.1);
    expect(prefs.highContrast).toBe(true);
  });

  it('falls back for invalid values', () => {
    const prefs = normalizeUserPreferences({
      language: 'xx',
      timezone: 123,
      fontScale: 2,
      highContrast: 'yes',
    });
    expect(prefs.language).toBe(DEFAULT_USER_PREFERENCES.language);
    expect(prefs.timezone).toBe(DEFAULT_USER_PREFERENCES.timezone);
    expect(prefs.fontScale).toBe(DEFAULT_USER_PREFERENCES.fontScale);
    expect(prefs.highContrast).toBe(DEFAULT_USER_PREFERENCES.highContrast);
  });

  it('uses notification semantics (defaults true unless explicitly false)', () => {
    const prefs = normalizeUserPreferences({
      push: false,
      email: false,
      sms: true,
      transactionAlerts: false,
      marketingEmails: true,
      securityAlerts: false,
      lowBalanceAlerts: false,
      largeTransactionAlerts: false,
    });
    expect(prefs.push).toBe(false);
    expect(prefs.email).toBe(false);
    expect(prefs.sms).toBe(true);
    expect(prefs.transactionAlerts).toBe(false);
    expect(prefs.marketingEmails).toBe(true);
    expect(prefs.securityAlerts).toBe(false);
    expect(prefs.lowBalanceAlerts).toBe(false);
    expect(prefs.largeTransactionAlerts).toBe(false);
  });
});

describe('buildPreferencesUpdate', () => {
  it('builds dotted Firestore update keys and omits undefined', () => {
    const update = buildPreferencesUpdate({
      language: 'es',
      timezone: null,
      highContrast: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fontScale: undefined as any,
    });

    expect(update).toEqual({
      'preferences.language': 'es',
      'preferences.timezone': null,
      'preferences.highContrast': true,
    });
  });
});
