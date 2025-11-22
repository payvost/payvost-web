/**
 * KYC Verification Providers
 * Centralized provider initialization and management
 */

import { SumsubProvider } from './sumsub';
import { DojahProvider } from './dojah';
import { ComplyAdvantageProvider } from './complyadvantage';
import { FirebaseProvider } from './firebase';
import { TwilioProvider } from './twilio';
import type { VerificationProvider, VerificationProviderName } from '../types';
import { PROVIDER_MAP } from '../config';

/**
 * Provider instances cache
 */
const providerInstances: Map<VerificationProviderName, VerificationProvider> = new Map();

/**
 * Initialize a provider instance
 */
function getProvider(name: VerificationProviderName): VerificationProvider {
  if (providerInstances.has(name)) {
    return providerInstances.get(name)!;
  }

  let provider: VerificationProvider;

  switch (name) {
    case 'sumsub':
      provider = new SumsubProvider();
      break;
    case 'dojah':
      provider = new DojahProvider();
      break;
    case 'complyadvantage':
      provider = new ComplyAdvantageProvider();
      break;
    case 'firebase':
      provider = new FirebaseProvider();
      break;
    case 'twilio':
      provider = new TwilioProvider();
      break;
    default:
      throw new Error(`Unknown provider: ${name}`);
  }

  providerInstances.set(name, provider);
  return provider;
}

/**
 * Get the best provider for a country
 */
export function getProviderForCountry(country: string): VerificationProvider | null {
  const providers = PROVIDER_MAP[country];
  if (!providers || providers.length === 0) {
    return null;
  }

  // Return the first provider (primary)
  return getProvider(providers[0]);
}

/**
 * Get all providers for a country (primary + fallback)
 */
export function getProvidersForCountry(country: string): VerificationProvider[] {
  const providers = PROVIDER_MAP[country];
  if (!providers || providers.length === 0) {
    return [];
  }

  return providers.map(name => getProvider(name));
}

/**
 * Get a specific provider by name
 */
export function getProviderByName(name: VerificationProviderName): VerificationProvider {
  return getProvider(name);
}

/**
 * Get email verification provider (Firebase or Twilio)
 */
export function getEmailProvider(): VerificationProvider {
  return getProvider('firebase');
}

/**
 * Get phone verification provider (Twilio or Firebase)
 */
export function getPhoneProvider(): VerificationProvider {
  // Prefer Twilio if configured, otherwise Firebase
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    return getProvider('twilio');
  }
  return getProvider('firebase');
}

/**
 * Get AML screening provider (ComplyAdvantage)
 */
export function getAMLProvider(): VerificationProvider {
  return getProvider('complyadvantage');
}

// Export all providers
export { SumsubProvider, DojahProvider, ComplyAdvantageProvider, FirebaseProvider, TwilioProvider };

