/**
 * KYC Verification Configuration
 * Provider mapping and country-specific settings
 */

import type { VerificationProviderName } from './types';

/**
 * Provider mapping by country
 * Maps countries to recommended verification providers
 */
export const PROVIDER_MAP: Record<string, VerificationProviderName[]> = {
  // African countries - Dojah is best for BVN, NIN, Ghana Card, KRA PIN
  NG: ['dojah', 'complyadvantage'], // Nigeria: BVN, NIN
  GH: ['dojah', 'complyadvantage'], // Ghana: Ghana Card, TIN
  KE: ['dojah', 'complyadvantage'], // Kenya: National ID, KRA PIN
  ZA: ['dojah', 'sumsub', 'complyadvantage'], // South Africa: ID, FICA

  // Global countries - Sumsub has free tier and good coverage
  US: ['sumsub', 'complyadvantage'], // United States: SSN, Driver's License
  GB: ['sumsub', 'complyadvantage'], // United Kingdom: Passport, FCA compliance
  CA: ['sumsub', 'complyadvantage'], // Canada: SIN, Driver's License
  AU: ['sumsub', 'complyadvantage'], // Australia: TFN, AUSTRAC
  DE: ['sumsub', 'complyadvantage'], // Germany: ID, BaFin
};

/**
 * Country-specific verification requirements
 */
export const COUNTRY_VERIFICATION_CONFIG: Record<
  string,
  {
    requiresBVN?: boolean;
    requiresNIN?: boolean;
    requiresSSN?: boolean;
    requiresSIN?: boolean;
    requiresTIN?: boolean;
    requiresGhanaCard?: boolean;
    requiresKraPin?: boolean;
    requiresTaxFileNumber?: boolean;
    idDocumentTypes?: string[];
    addressDocumentTypes?: string[];
  }
> = {
  NG: {
    requiresBVN: true,
    requiresNIN: true,
    requiresTIN: true,
    idDocumentTypes: ['NIN', 'Passport', 'Driver License', 'Voter Card'],
    addressDocumentTypes: ['Utility Bill', 'Bank Statement'],
  },
  GH: {
    requiresGhanaCard: true,
    requiresTIN: true,
    idDocumentTypes: ['Ghana Card', 'Passport'],
    addressDocumentTypes: ['Utility Bill', 'Bank Statement'],
  },
  KE: {
    requiresKraPin: true,
    idDocumentTypes: ['National ID', 'Passport'],
    addressDocumentTypes: ['Utility Bill', 'Lease Agreement'],
  },
  ZA: {
    idDocumentTypes: ['SA ID', 'Passport'],
    addressDocumentTypes: ['Utility Bill', 'Bank Statement'],
  },
  US: {
    requiresSSN: true,
    idDocumentTypes: ['Driver License', 'State ID', 'Passport'],
    addressDocumentTypes: ['Utility Bill', 'Bank Statement'],
  },
  GB: {
    idDocumentTypes: ['Passport', 'Driver License'],
    addressDocumentTypes: ['Council Tax', 'Utility Bill', 'Bank Statement'],
  },
  CA: {
    requiresSIN: true,
    idDocumentTypes: ['Passport', 'Driver License', 'PR Card'],
    addressDocumentTypes: ['Bank Statement', 'Utility Bill'],
  },
  AU: {
    requiresTaxFileNumber: true,
    idDocumentTypes: ['Passport', 'Driver License', 'Medicare Card'],
    addressDocumentTypes: ['Utility Bill', 'Bank Statement'],
  },
  DE: {
    idDocumentTypes: ['National ID', 'Passport'],
    addressDocumentTypes: ['Meldebescheinigung', 'Utility Bill'],
  },
};

/**
 * Tier-specific verification requirements
 */
export const TIER_VERIFICATION_REQUIREMENTS: Record<
  string,
  {
    email: boolean;
    phone: boolean;
    idDocument: boolean;
    address: boolean;
    faceMatch: boolean;
    taxID: boolean;
    amlScreening: boolean;
  }
> = {
  tier1: {
    email: true,
    phone: true,
    idDocument: false,
    address: false,
    faceMatch: false,
    taxID: false, // Country-specific
    amlScreening: false,
  },
  tier2: {
    email: true,
    phone: true,
    idDocument: true,
    address: true,
    faceMatch: true,
    taxID: false, // Optional
    amlScreening: false,
  },
  tier3: {
    email: true,
    phone: true,
    idDocument: true,
    address: true,
    faceMatch: true,
    taxID: true, // Required
    amlScreening: true,
  },
};

/**
 * Confidence score thresholds for auto-approval
 */
export const AUTO_APPROVAL_THRESHOLDS = {
  tier1: {
    minConfidence: 80,
    requiredChecks: ['email', 'phone'],
  },
  tier2: {
    minConfidence: 90,
    requiredChecks: ['email', 'phone', 'idDocument', 'address', 'faceMatch'],
  },
  tier3: {
    minConfidence: 95, // Tier 3 always requires manual review, but threshold for recommendation
    requiredChecks: ['email', 'phone', 'idDocument', 'address', 'faceMatch', 'taxID', 'amlScreening'],
  },
};

