import type { LanguagePreference } from '@/types/language';

export type UserPreferences = {
  // UI preferences
  language: LanguagePreference;
  timezone: string | null; // null means "system"
  fontScale: 0.9 | 1 | 1.1;
  highContrast: boolean;

  // Notification preferences
  push: boolean;
  email: boolean;
  sms: boolean;
  transactionAlerts: boolean;
  marketingEmails: boolean;
  securityAlerts: boolean;
  lowBalanceAlerts: boolean;
  largeTransactionAlerts: boolean;
};

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  language: 'en',
  timezone: null,
  fontScale: 1,
  highContrast: false,

  push: true,
  email: true,
  sms: false,
  transactionAlerts: true,
  marketingEmails: false,
  securityAlerts: true,
  lowBalanceAlerts: true,
  largeTransactionAlerts: true,
};

const VALID_LANGUAGES: LanguagePreference[] = ['en', 'fr', 'es'];
const VALID_FONT_SCALES: Array<UserPreferences['fontScale']> = [0.9, 1, 1.1];

export function normalizeUserPreferences(raw: unknown): UserPreferences {
  const p = (raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}) as Record<
    string,
    unknown
  >;

  const language: LanguagePreference = VALID_LANGUAGES.includes(p.language as LanguagePreference)
    ? (p.language as LanguagePreference)
    : DEFAULT_USER_PREFERENCES.language;

  const timezone = typeof p.timezone === 'string' ? p.timezone : DEFAULT_USER_PREFERENCES.timezone;

  const fontScale =
    typeof p.fontScale === 'number' && VALID_FONT_SCALES.includes(p.fontScale as any)
      ? (p.fontScale as UserPreferences['fontScale'])
      : DEFAULT_USER_PREFERENCES.fontScale;

  const highContrast =
    typeof p.highContrast === 'boolean' ? p.highContrast : DEFAULT_USER_PREFERENCES.highContrast;

  // Match existing semantics used by the notification system:
  // - Most toggles default to true unless explicitly false.
  // - Marketing defaults to false unless explicitly true.
  // - SMS defaults to false unless explicitly true.
  const push = p.push !== false;
  const email = p.email !== false;
  const sms = p.sms === true;
  const transactionAlerts = p.transactionAlerts !== false;
  const marketingEmails = p.marketingEmails === true;
  const securityAlerts = p.securityAlerts !== false;
  const lowBalanceAlerts = p.lowBalanceAlerts !== false;
  const largeTransactionAlerts = p.largeTransactionAlerts !== false;

  return {
    language,
    timezone,
    fontScale,
    highContrast,
    push,
    email,
    sms,
    transactionAlerts,
    marketingEmails,
    securityAlerts,
    lowBalanceAlerts,
    largeTransactionAlerts,
  };
}

export function buildPreferencesUpdate(partial: Partial<UserPreferences>): Record<string, unknown> {
  const update: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(partial) as Array<[keyof UserPreferences, unknown]>) {
    if (value === undefined) continue;
    update[`preferences.${String(key)}`] = value;
  }
  return update;
}

