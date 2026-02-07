import { isKycVerified } from '@/types/kyc';

export type CapabilityKey =
  | 'payments.send'
  | 'payments.request'
  | 'payments.bills'
  | 'payments.scheduled'
  | 'payments.disputes'
  | 'payments.methods';

export type CapabilityState = {
  enabled: boolean;
  reason?: string;
  resolveHref?: string;
};

export type Capabilities = Record<CapabilityKey, CapabilityState>;

export type CapabilitiesInput = {
  kycStatus?: string | null;
  accountRestricted?: boolean;
  countryCode?: string | null;
  featureFlags?: Partial<Record<CapabilityKey, boolean>>;
};

const DEFAULT_RESOLVE_HREF = '/dashboard/kyc/upgrade-tier2';

export function computeCapabilities(input: CapabilitiesInput): Capabilities {
  const flags = input.featureFlags ?? {};
  const restricted = Boolean(input.accountRestricted);
  const kycOk = isKycVerified(input.kycStatus);

  const gate = (key: CapabilityKey, enabled: boolean, reason?: string): CapabilityState => {
    const flagEnabled = flags[key] ?? true;
    if (!flagEnabled) {
      return { enabled: false, reason: 'Not available for your account yet.' };
    }
    if (!enabled) {
      return {
        enabled: false,
        reason: reason || 'Not available for your account.',
        resolveHref: DEFAULT_RESOLVE_HREF,
      };
    }
    return { enabled: true };
  };

  if (restricted) {
    return {
      'payments.send': { enabled: false, reason: 'Your account is restricted. Please contact support.' },
      'payments.request': { enabled: false, reason: 'Your account is restricted. Please contact support.' },
      'payments.bills': { enabled: false, reason: 'Your account is restricted. Please contact support.' },
      'payments.scheduled': { enabled: false, reason: 'Your account is restricted. Please contact support.' },
      'payments.disputes': { enabled: false, reason: 'Your account is restricted. Please contact support.' },
      'payments.methods': { enabled: false, reason: 'Your account is restricted. Please contact support.' },
    };
  }

  return {
    'payments.send': gate('payments.send', kycOk, 'Complete verification to send money.'),
    'payments.request': gate('payments.request', kycOk, 'Complete verification to request money.'),
    'payments.bills': gate('payments.bills', kycOk, 'Complete verification to pay bills.'),
    'payments.scheduled': gate('payments.scheduled', kycOk, 'Complete verification to schedule payments.'),
    'payments.disputes': gate('payments.disputes', true),
    'payments.methods': gate('payments.methods', true),
  };
}

