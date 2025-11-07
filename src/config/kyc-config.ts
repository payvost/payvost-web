export const KYC_DYNAMIC_FIELD_NAMES = [
  'bvn',
  'ssnLast4',
  'ssn',
  'sin',
  'tin',
  'kraPin',
  'ghanaCardNumber',
  'ghanaTin',
  'kenyaNationalId',
  'southAfricaIdNumber',
  'southAfricaTaxNumber',
  'australiaTaxFileNumber',
  'germanyTaxId',
] as const;

export type KycFieldName = typeof KYC_DYNAMIC_FIELD_NAMES[number];

export interface AdditionalFieldConfig {
  name: KycFieldName;
  label: string;
  placeholder?: string;
  helperText?: string;
  required: boolean;
  inputMode?: 'text' | 'numeric';
  maxLength?: number;
  pattern?: RegExp;
  patternMessage?: string;
  normalize?: (value: string) => string;
}

export type DocumentRequirementType =
  | 'government-id'
  | 'proof-of-address'
  | 'selfie'
  | 'face-match'
  | 'source-of-funds'
  | 'tax'
  | 'business-docs'
  | 'manual-review';

export interface DocumentRequirement {
  type: DocumentRequirementType;
  label: string;
  description?: string;
  required: boolean;
}

export type KycTierKey = 'tier1' | 'tier2' | 'tier3';

export interface KycTierConfig {
  label: string;
  summary: string;
  requirements: string[];
  additionalFields?: AdditionalFieldConfig[];
  documents?: DocumentRequirement[];
  notes?: string[];
}

export interface CountryKycConfig {
  tiers: Record<KycTierKey, KycTierConfig>;
}

export interface SupportedCountry {
  iso2: string;
  name: string;
  callingCodes: string[];
  currency: string;
  flagCode?: string;
  kyc: CountryKycConfig;
}

const digitsOnly = (value: string) => value.replace(/\D/g, '');
const alphanumericUpper = (value: string) => value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

const createBvnField = (required: boolean): AdditionalFieldConfig => ({
  name: 'bvn',
  label: 'Bank Verification Number (BVN)',
  placeholder: '22345678901',
  helperText: required
    ? '11 digits issued by the Central Bank of Nigeria. Required for verification.'
    : 'Optional 11-digit BVN to help unlock higher limits faster.',
  required,
  inputMode: 'numeric',
  maxLength: 11,
  pattern: /^\d{11}$/,
  patternMessage: 'BVN must be exactly 11 digits.',
  normalize: digitsOnly,
});

const createSsnLast4Field = (): AdditionalFieldConfig => ({
  name: 'ssnLast4',
  label: 'SSN (Last 4 digits)',
  placeholder: '1234',
  helperText: 'Required. Enter the last four digits of your Social Security Number.',
  required: true,
  inputMode: 'numeric',
  maxLength: 4,
  pattern: /^\d{4}$/,
  patternMessage: 'Enter the last four digits of your SSN.',
  normalize: digitsOnly,
});

const createSsnField = (): AdditionalFieldConfig => ({
  name: 'ssn',
  label: 'Social Security Number (SSN)',
  placeholder: '123456789',
  helperText: 'Nine digits as issued by the Social Security Administration.',
  required: true,
  inputMode: 'numeric',
  maxLength: 9,
  pattern: /^\d{9}$/,
  patternMessage: 'SSN must be exactly 9 digits.',
  normalize: digitsOnly,
});

const createTinField = (): AdditionalFieldConfig => ({
  name: 'tin',
  label: 'Tax Identification Number (TIN)',
  placeholder: '1234567890',
  helperText: '10-digit TIN issued by the Federal Inland Revenue Service.',
  required: true,
  inputMode: 'numeric',
  maxLength: 10,
  pattern: /^\d{10}$/,
  patternMessage: 'TIN must be exactly 10 digits.',
  normalize: digitsOnly,
});

const createGhanaCardField = (required: boolean): AdditionalFieldConfig => ({
  name: 'ghanaCardNumber',
  label: 'Ghana Card Number',
  placeholder: 'GHA1234567890',
  helperText: required
    ? 'Provide your Ghana Card number exactly as printed on the card.'
    : 'Optional at Tier 1, but required for higher transaction limits.',
  required,
  inputMode: 'text',
  maxLength: 13,
  pattern: /^GHA\d{10}$/,
  patternMessage: 'Enter a valid Ghana Card number (e.g. GHA1234567890).',
  normalize: (value) => {
    const normalized = alphanumericUpper(value);
    if (!normalized.startsWith('GHA')) {
      return `GHA${normalized}`.slice(0, 13);
    }
    return normalized;
  },
});

const createGhanaTinField = (): AdditionalFieldConfig => ({
  name: 'ghanaTin',
  label: 'Ghana TIN',
  placeholder: 'P0000000001',
  helperText: 'Provide your Ghana Revenue Authority tax identification number.',
  required: true,
  inputMode: 'text',
  maxLength: 13,
  pattern: /^[A-Z0-9]{8,13}$/,
  patternMessage: 'Enter a valid Ghana TIN (alphanumeric, 8-13 characters).',
  normalize: alphanumericUpper,
});

const createKenyaNationalIdField = (required: boolean): AdditionalFieldConfig => ({
  name: 'kenyaNationalId',
  label: 'Kenyan National ID / Passport Number',
  placeholder: '12345678',
  helperText: required
    ? 'Provide your Kenyan National ID or passport number.'
    : 'Optional for Tier 1 but required to unlock higher limits.',
  required,
  inputMode: 'numeric',
  maxLength: 10,
  pattern: /^\d{6,10}$/,
  patternMessage: 'ID number should contain 6-10 digits.',
  normalize: digitsOnly,
});

const createKraPinField = (): AdditionalFieldConfig => ({
  name: 'kraPin',
  label: 'KRA PIN',
  placeholder: 'A123456789B',
  helperText: 'Kenya Revenue Authority PIN (one letter, nine digits, one letter).',
  required: true,
  inputMode: 'text',
  maxLength: 11,
  pattern: /^[A-Z]\d{9}[A-Z]$/,
  patternMessage: 'Enter a valid KRA PIN (e.g. A123456789B).',
  normalize: alphanumericUpper,
});

const createSouthAfricaIdField = (required: boolean): AdditionalFieldConfig => ({
  name: 'southAfricaIdNumber',
  label: 'South African ID Number',
  placeholder: '1234567890123',
  helperText: required
    ? '13-digit South African ID number or passport required for FICA compliance.'
    : 'Optional for Tier 1 wallets but required for FICA verification.',
  required,
  inputMode: 'numeric',
  maxLength: 13,
  pattern: /^\d{13}$/,
  patternMessage: 'South African ID numbers contain 13 digits.',
  normalize: digitsOnly,
});

const createSouthAfricaTaxNumberField = (required: boolean): AdditionalFieldConfig => ({
  name: 'southAfricaTaxNumber',
  label: 'South African Tax Number',
  placeholder: '1234567890',
  helperText: 'Provide if you have an issued SARS tax reference number.',
  required,
  inputMode: 'numeric',
  maxLength: 10,
  pattern: /^\d{10}$/,
  patternMessage: 'Tax numbers contain 10 digits.',
  normalize: digitsOnly,
});

const createAustraliaTaxFileNumberField = (required: boolean): AdditionalFieldConfig => ({
  name: 'australiaTaxFileNumber',
  label: 'Tax File Number (TFN)',
  placeholder: '123456789',
  helperText: 'Required for unlimited transaction limits under AUSTRAC guidance.',
  required,
  inputMode: 'numeric',
  maxLength: 9,
  pattern: /^\d{9}$/,
  patternMessage: 'TFN must be exactly 9 digits.',
  normalize: digitsOnly,
});

const createGermanyTaxIdField = (): AdditionalFieldConfig => ({
  name: 'germanyTaxId',
  label: 'Steuerliche Identifikationsnummer',
  placeholder: '12345678901',
  helperText: '11-digit German tax identification number (Steuer-ID).',
  required: true,
  inputMode: 'numeric',
  maxLength: 11,
  pattern: /^\d{11}$/,
  patternMessage: 'German tax IDs contain exactly 11 digits.',
  normalize: digitsOnly,
});

const createSinField = (required: boolean): AdditionalFieldConfig => ({
  name: 'sin',
  label: 'Social Insurance Number (SIN)',
  placeholder: '123456789',
  helperText: 'Nine digits. Spaces are optional and will be removed automatically.',
  required,
  inputMode: 'numeric',
  maxLength: 9,
  pattern: /^\d{9}$/,
  patternMessage: 'SIN must be exactly 9 digits.',
  normalize: digitsOnly,
});

const BASE_TIERS: Record<KycTierKey, KycTierConfig> = {
  tier1: {
    label: 'Tier 1 – Basic',
    summary: 'Provide foundational identity information to activate your account.',
    requirements: [
      'Full legal name, mobile number, and verified email address',
      'Date of birth and residential address',
      'Selfie or profile photo for account security',
    ],
  },
  tier2: {
    label: 'Tier 2 – Verified',
    summary: 'Submit government ID and proof of address to unlock higher limits.',
    requirements: [
      'One government-issued photo ID',
      'Proof of address document dated within the last 3 months',
    ],
    documents: [
      {
        type: 'government-id',
        label: 'Government-issued photo ID',
        required: true,
      },
      {
        type: 'proof-of-address',
        label: 'Proof of address (utility bill or bank statement)',
        required: true,
      },
    ],
  },
  tier3: {
    label: 'Tier 3 – Enhanced Due Diligence',
    summary: 'Provide financial information for unlimited access and regulatory compliance.',
    requirements: [
      'Source of funds or occupation details',
      'Additional AML and sanctions screening',
    ],
    notes: ['Manual compliance review may be required depending on risk profile.'],
  },
};

const mergeTier = (tier: KycTierKey, overrides?: Partial<KycTierConfig>): KycTierConfig => ({
  label: overrides?.label ?? BASE_TIERS[tier].label,
  summary: overrides?.summary ?? BASE_TIERS[tier].summary,
  requirements: overrides?.requirements ?? BASE_TIERS[tier].requirements,
  additionalFields: overrides?.additionalFields ?? BASE_TIERS[tier].additionalFields,
  documents: overrides?.documents ?? BASE_TIERS[tier].documents,
  notes: overrides?.notes ?? BASE_TIERS[tier].notes,
});

const createKycConfig = (
  overrides: Partial<Record<KycTierKey, Partial<KycTierConfig>>> = {}
): CountryKycConfig => ({
  tiers: {
    tier1: mergeTier('tier1', overrides.tier1),
    tier2: mergeTier('tier2', overrides.tier2),
    tier3: mergeTier('tier3', overrides.tier3),
  },
});

export const DEFAULT_KYC_CONFIG = createKycConfig();

export const SUPPORTED_COUNTRIES: SupportedCountry[] = [
  {
    iso2: 'AU',
    name: 'Australia',
    callingCodes: ['61'],
    currency: 'AUD',
    flagCode: 'au',
    kyc: createKycConfig({
      tier1: {
        summary: 'Basic wallet access for Australian customers with starter limits.',
        requirements: [
          'Full legal name, mobile number, and email address',
          'Date of birth and Australian residential address',
          'Selfie or profile photo',
        ],
      },
      tier2: {
        summary: 'Meet AUSTRAC standards to increase your transaction limits.',
        requirements: [
          'Government-issued ID (Passport, Driver’s Licence, or Medicare Card)',
          'Proof of Australian residential address dated within 3 months',
        ],
        documents: [
          {
            type: 'government-id',
            label: 'Australian government-issued ID (Passport, Driver’s Licence, or Medicare Card)',
            description: 'Provide a clear photo or scan of the document.',
            required: true,
          },
          {
            type: 'proof-of-address',
            label: 'Recent proof of address',
            description: 'Utility bill or bank statement issued within the last 90 days.',
            required: true,
          },
        ],
      },
      tier3: {
        summary: 'Provide enhanced due diligence information to remove limits.',
        requirements: [
          'Tax File Number (TFN) or business registration documentation',
          'Source of funds declaration',
          'Manual compliance and AML screening',
        ],
        additionalFields: [createAustraliaTaxFileNumberField(true)],
        documents: [
          {
            type: 'source-of-funds',
            label: 'Source of funds / income declaration',
            required: true,
          },
          {
            type: 'manual-review',
            label: 'Manual compliance review',
            required: true,
          },
        ],
      },
    }),
  },
  {
    iso2: 'CA',
    name: 'Canada',
    callingCodes: ['1'],
    currency: 'CAD',
    flagCode: 'ca',
    kyc: createKycConfig({
      tier1: {
        summary: 'Basic verification for Canadian residents to access core features.',
        requirements: [
          'Full legal name and preferred contact details',
          'Date of birth and residential address',
        ],
      },
      tier2: {
        summary: 'Submit standard FINTRAC documentation to raise your limits.',
        requirements: [
          'Government-issued photo ID (Passport, Driver’s Licence, PR Card)',
          'Proof of address dated within the last 3 months',
        ],
        documents: [
          {
            type: 'government-id',
            label: 'Canadian government-issued photo ID',
            description: 'Passport, Driver’s Licence, or Permanent Resident Card.',
            required: true,
          },
          {
            type: 'proof-of-address',
            label: 'Proof of address',
            description: 'Bank statement or utility bill issued within 90 days.',
            required: true,
          },
        ],
      },
      tier3: {
        summary: 'Provide enhanced information required for high volume accounts.',
        requirements: [
          'Social Insurance Number (SIN)',
          'Source of funds declaration and employer information',
          'AML / PEP screening and manual review',
        ],
        additionalFields: [createSinField(true)],
        documents: [
          {
            type: 'source-of-funds',
            label: 'Source of funds declaration',
            required: true,
          },
          {
            type: 'manual-review',
            label: 'Manual compliance review',
            required: true,
          },
        ],
      },
    }),
  },
  {
    iso2: 'DE',
    name: 'Germany',
    callingCodes: ['49'],
    currency: 'EUR',
    flagCode: 'de',
    kyc: createKycConfig({
      tier1: {
        summary: 'Get started with essential identity information for BaFin compliance.',
        requirements: [
          'Full name, email, and phone number',
          'Date of birth and German residential address',
        ],
      },
      tier2: {
        summary: 'Complete BaFin standard verification to lift your limits.',
        requirements: [
          'National ID card or passport',
          'Address verification (Meldebescheinigung or recent utility bill)',
          'Selfie verification or video KYC session',
        ],
        documents: [
          {
            type: 'government-id',
            label: 'German national ID card or passport',
            required: true,
          },
          {
            type: 'proof-of-address',
            label: 'Proof of address document',
            required: true,
          },
          {
            type: 'face-match',
            label: 'Video or selfie verification',
            required: true,
          },
        ],
      },
      tier3: {
        summary: 'Provide enhanced documentation for unlimited enterprise access.',
        requirements: [
          'German tax ID (Steuer-ID)',
          'Source of funds or income documentation',
          'Video identity verification and manual compliance review',
        ],
        additionalFields: [createGermanyTaxIdField()],
        documents: [
          {
            type: 'source-of-funds',
            label: 'Source of funds documentation',
            required: true,
          },
          {
            type: 'manual-review',
            label: 'Manual compliance review',
            required: true,
          },
        ],
      },
    }),
  },
  {
    iso2: 'GH',
    name: 'Ghana',
    callingCodes: ['233'],
    currency: 'GHS',
    flagCode: 'gh',
    kyc: createKycConfig({
      tier1: {
        summary: 'Open a Tier 1 wallet with essential contact information.',
        requirements: [
          'Full name, email, and phone number',
          'Residential address within Ghana',
          'Ghana Card number for identity matching',
        ],
        additionalFields: [createGhanaCardField(true)],
      },
      tier2: {
        summary: 'Provide standard documents to raise your wallet limits.',
        requirements: [
          'Ghana Card (mandatory)',
          'Proof of address (utility bill or bank statement)',
          'Selfie with ID for face match verification',
        ],
        additionalFields: [createGhanaCardField(true)],
        documents: [
          {
            type: 'government-id',
            label: 'Ghana Card',
            required: true,
          },
          {
            type: 'proof-of-address',
            label: 'Proof of address document',
            required: true,
          },
          {
            type: 'selfie',
            label: 'Selfie with Ghana Card',
            required: true,
          },
        ],
      },
      tier3: {
        summary: 'Submit tax documentation for unlimited business operations.',
        requirements: [
          'Ghana Revenue Authority TIN',
          'Source of funds declaration',
          'Business registration certificate for merchants',
        ],
        additionalFields: [createGhanaTinField()],
        documents: [
          {
            type: 'business-docs',
            label: 'Business registration certificate (for merchants)',
            required: false,
          },
          {
            type: 'source-of-funds',
            label: 'Source of funds declaration',
            required: true,
          },
        ],
      },
    }),
  },
  {
    iso2: 'KE',
    name: 'Kenya',
    callingCodes: ['254'],
    currency: 'KES',
    flagCode: 'ke',
    kyc: createKycConfig({
      tier1: {
        summary: 'Activate a Tier 1 wallet with your basic identity details.',
        requirements: [
          'Full name, email, and phone number',
          'Residential address within Kenya',
          'Kenyan National ID or passport number',
        ],
        additionalFields: [createKenyaNationalIdField(true)],
      },
      tier2: {
        summary: 'Provide Kenyan government ID to unlock medium transaction limits.',
        requirements: [
          'National ID or passport (mandatory)',
          'Proof of address (utility bill or lease agreement)',
          'Selfie verification',
        ],
        additionalFields: [createKenyaNationalIdField(true)],
        documents: [
          {
            type: 'government-id',
            label: 'Kenyan National ID or passport',
            required: true,
          },
          {
            type: 'proof-of-address',
            label: 'Proof of address document',
            required: true,
          },
          {
            type: 'selfie',
            label: 'Selfie verification',
            required: true,
          },
        ],
      },
      tier3: {
        summary: 'Submit tax and income details for unrestricted access.',
        requirements: [
          'KRA PIN (Tax ID)',
          'Source of funds / employment information',
          'Enhanced compliance screening',
        ],
        additionalFields: [createKraPinField()],
        documents: [
          {
            type: 'source-of-funds',
            label: 'Source of funds declaration',
            required: true,
          },
          {
            type: 'manual-review',
            label: 'Manual compliance review',
            required: true,
          },
        ],
      },
    }),
  },
  {
    iso2: 'NG',
    name: 'Nigeria',
    callingCodes: ['234'],
    currency: 'NGN',
    flagCode: 'ng',
    kyc: createKycConfig({
      tier1: {
        summary: 'Tier 1 wallets provide low-risk access with essential identity data.',
        requirements: [
          'Full name, verified phone number, and email address',
          'Date of birth and residential address',
          'Selfie or profile photo',
          'Bank Verification Number (BVN)',
        ],
        additionalFields: [createBvnField(true)],
      },
      tier2: {
        summary: 'Provide full Nigerian KYC documents to lift daily limits.',
        requirements: [
          'Valid government ID (NIN Slip, Driver’s Licence, Voter’s Card, or Passport)',
          'Proof of address (utility bill or bank statement)',
          'Mandatory BVN',
          'Face match verification',
        ],
        additionalFields: [createBvnField(true)],
        documents: [
          {
            type: 'government-id',
            label: 'Government-issued ID (NIN Slip, Driver’s Licence, Voter’s Card, or Passport)',
            required: true,
          },
          {
            type: 'proof-of-address',
            label: 'Proof of address document',
            required: true,
          },
          {
            type: 'face-match',
            label: 'Face match verification',
            required: true,
          },
        ],
      },
      tier3: {
        summary: 'Provide financial documents for unlimited wallet functionality.',
        requirements: [
          'Source of funds / occupation information',
          'Tax Identification Number (TIN)',
          'Bank verification letter or proof of income',
          'Manual compliance review',
        ],
        additionalFields: [createTinField()],
        documents: [
          {
            type: 'source-of-funds',
            label: 'Source of funds declaration',
            required: true,
          },
          {
            type: 'manual-review',
            label: 'Manual compliance review',
            required: true,
          },
        ],
      },
    }),
  },
  {
    iso2: 'ZA',
    name: 'South Africa',
    callingCodes: ['27'],
    currency: 'ZAR',
    flagCode: 'za',
    kyc: createKycConfig({
      tier1: {
        summary: 'Open a Tier 1 wallet with basic FICA information.',
        requirements: [
          'Full name and verified contact details',
          'Residential address within South Africa',
          'South African ID number or passport',
        ],
        additionalFields: [createSouthAfricaIdField(true)],
      },
      tier2: {
        summary: 'Comply with FICA requirements to unlock higher limits.',
        requirements: [
          'Valid South African ID or passport (mandatory)',
          'Proof of address (FICA-compliant utility bill)',
          'Selfie verification',
        ],
        additionalFields: [createSouthAfricaIdField(true)],
        documents: [
          {
            type: 'government-id',
            label: 'Valid SA ID book/card or passport',
            required: true,
          },
          {
            type: 'proof-of-address',
            label: 'FICA proof of address',
            required: true,
          },
          {
            type: 'selfie',
            label: 'Selfie verification',
            required: true,
          },
        ],
      },
      tier3: {
        summary: 'Provide enhanced documentation for high value accounts.',
        requirements: [
          'Source of funds / employer details',
          'Tax number (if applicable)',
          'Sanctions screening and manual review',
        ],
        additionalFields: [createSouthAfricaTaxNumberField(false)],
        documents: [
          {
            type: 'source-of-funds',
            label: 'Source of funds declaration',
            required: true,
          },
          {
            type: 'manual-review',
            label: 'Manual compliance review',
            required: true,
          },
        ],
      },
    }),
  },
  {
    iso2: 'GB',
    name: 'United Kingdom',
    callingCodes: ['44'],
    currency: 'GBP',
    flagCode: 'gb',
    kyc: createKycConfig({
      tier1: {
        summary: 'Open a Tier 1 account with basic FCA-compliant information.',
        requirements: [
          'Full name and preferred contact details',
          'Date of birth and UK phone number',
        ],
      },
      tier2: {
        summary: 'Submit standard UK KYC documents to increase limits.',
        requirements: [
          'Government-issued photo ID (Passport or Driver’s Licence)',
          'Proof of address (Council Tax, utility bill, or bank statement)',
        ],
        documents: [
          {
            type: 'government-id',
            label: 'Passport or Driver’s Licence',
            required: true,
          },
          {
            type: 'proof-of-address',
            label: 'Proof of address (issued within 3 months)',
            required: true,
          },
        ],
      },
      tier3: {
        summary: 'Undergo enhanced due diligence for full FCA compliance.',
        requirements: [
          'Source of funds declaration',
          'Employer or business details',
          'Additional ID verification or video KYC',
          'Sanctions and PEP screening',
        ],
        documents: [
          {
            type: 'source-of-funds',
            label: 'Source of funds declaration',
            required: true,
          },
          {
            type: 'manual-review',
            label: 'Enhanced due diligence review',
            required: true,
          },
        ],
      },
    }),
  },
  {
    iso2: 'US',
    name: 'United States',
    callingCodes: ['1'],
    currency: 'USD',
    flagCode: 'us',
    kyc: createKycConfig({
      tier1: {
        summary: 'Basic onboarding for low-risk accounts under U.S. regulations.',
        requirements: [
          'Full legal name and verified contact details',
          'Date of birth and residential address',
          'SSN last four digits for identity verification',
        ],
        additionalFields: [createSsnLast4Field()],
      },
      tier2: {
        summary: 'Provide full CIP documentation to unlock higher transaction limits.',
        requirements: [
          'Full Social Security Number (SSN)',
          'Government-issued photo ID (Driver’s Licence, State ID, or Passport)',
          'Proof of address (utility bill or bank statement)',
        ],
        additionalFields: [createSsnField()],
        documents: [
          {
            type: 'government-id',
            label: 'Government-issued photo ID',
            required: true,
          },
          {
            type: 'proof-of-address',
            label: 'Proof of address document',
            required: true,
          },
        ],
      },
      tier3: {
        summary: 'Provide enhanced due diligence documentation for EDD accounts.',
        requirements: [
          'Proof of income or recent tax return for high-volume usage',
          'Business registration documents for corporate accounts',
          'Source of funds declaration',
          'Manual OFAC / AML compliance review',
        ],
        documents: [
          {
            type: 'source-of-funds',
            label: 'Source of funds declaration / tax documentation',
            required: true,
          },
          {
            type: 'business-docs',
            label: 'Business registration documents (if applicable)',
            required: false,
          },
          {
            type: 'manual-review',
            label: 'Manual OFAC / AML review',
            required: true,
          },
        ],
      },
    }),
  },
];

export const SUPPORTED_COUNTRY_MAP: Record<string, SupportedCountry> = SUPPORTED_COUNTRIES.reduce(
  (accumulator, country) => {
    accumulator[country.iso2] = country;
    return accumulator;
  },
  {} as Record<string, SupportedCountry>
);
