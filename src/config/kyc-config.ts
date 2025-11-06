export type KycFieldName = 'bvn' | 'ssn' | 'sin' | 'nin';

export interface AdditionalFieldConfig {
  name: KycFieldName;
  label: string;
  placeholder?: string;
  helperText?: string;
  required: boolean;
  inputMode?: 'text' | 'numeric';
  maxLength?: number;
  pattern?: RegExp;
  normalize?: (value: string) => string;
}

export interface IdTypeOption {
  value: string;
  label: string;
  description?: string;
}

export interface CountryKycConfig {
  idTypes: IdTypeOption[];
  idNumberLabel?: string;
  idNumberDescription?: string;
  documentHelpText?: string;
  additionalFields?: AdditionalFieldConfig[];
  idNumberPattern?: RegExp;
  idNumberPatternMessage?: string;
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
const uppercaseNoSpaces = (value: string) => value.replace(/\s+/g, '').toUpperCase();

export const SUPPORTED_COUNTRIES: SupportedCountry[] = [
  {
    iso2: 'US',
    name: 'United States',
    callingCodes: ['1'],
    currency: 'USD',
    flagCode: 'us',
    kyc: {
      idTypes: [
        { value: 'us-passport', label: 'U.S. Passport' },
        { value: 'drivers-license', label: "Driver's License" },
        { value: 'state-id', label: 'State ID Card' },
      ],
      idNumberLabel: 'Document Number',
      idNumberDescription: 'Enter the identifier printed on the document you selected above.',
      documentHelpText: 'Upload a clear image or PDF of your selected government-issued ID. Ensure all corners are visible.',
      additionalFields: [
        {
          name: 'ssn',
          label: 'Social Security Number (SSN)',
          placeholder: '123-45-6789',
          helperText: 'We use your SSN to verify your identity with U.S. partners. Hyphens are optional.',
          required: true,
          inputMode: 'numeric',
          maxLength: 11,
          pattern: /^\d{9}$/,
          normalize: digitsOnly,
        },
      ],
      idNumberPatternMessage: 'Enter a valid document number for the United States.',
    },
  },
  {
    iso2: 'GB',
    name: 'United Kingdom',
    callingCodes: ['44'],
    currency: 'GBP',
    flagCode: 'gb',
    kyc: {
      idTypes: [
        { value: 'uk-passport', label: 'UK Passport' },
        { value: 'drivers-license', label: "Driver's Licence" },
        { value: 'national-id', label: 'Citizenship / Residence Card' },
      ],
      idNumberLabel: 'Document Number',
      idNumberDescription: 'Enter the identifier as it appears on your selected document.',
      documentHelpText: 'Upload a full-colour scan or photo. Both sides required for cards.',
      additionalFields: [
        {
          name: 'nin',
          label: 'National Insurance Number (NINO)',
          placeholder: 'QQ123456C',
          helperText: 'Two letters, six digits, and an optional final letter (A, B, C, or D).',
          required: true,
          inputMode: 'text',
          maxLength: 9,
          pattern: /^[A-CEGHJ-PR-TW-Z]{2}\d{6}[A-D]?$/,
          normalize: uppercaseNoSpaces,
        },
      ],
      idNumberPatternMessage: 'Enter a valid UK document number.',
    },
  },
  {
    iso2: 'CA',
    name: 'Canada',
    callingCodes: ['1'],
    currency: 'CAD',
    flagCode: 'ca',
    kyc: {
      idTypes: [
        { value: 'ca-passport', label: 'Canadian Passport' },
        { value: 'drivers-license', label: "Driver's Licence" },
        { value: 'permanent-resident-card', label: 'Permanent Resident Card' },
      ],
      idNumberLabel: 'Document Number',
      idNumberDescription: 'Enter the identifier on the document you selected.',
      documentHelpText: 'Upload a clear scan or photo (front and back for cards).',
      additionalFields: [
        {
          name: 'sin',
          label: 'Social Insurance Number (SIN)',
          placeholder: '123 456 789',
          helperText: 'Nine digits. Spaces are optional and will be removed automatically.',
          required: true,
          inputMode: 'numeric',
          maxLength: 11,
          pattern: /^\d{9}$/,
          normalize: digitsOnly,
        },
      ],
      idNumberPatternMessage: 'Enter a valid Canadian document number.',
    },
  },
  {
    iso2: 'NG',
    name: 'Nigeria',
    callingCodes: ['234'],
    currency: 'NGN',
    flagCode: 'ng',
    kyc: {
      idTypes: [
        { value: 'nin-slip', label: 'National Identity Number (NIN) Slip' },
        { value: 'drivers-license', label: "Driver's Licence" },
        { value: 'passport', label: 'International Passport' },
        { value: 'voters-card', label: "Voter's Card" },
      ],
      idNumberLabel: 'ID Number',
      idNumberDescription: 'Provide the number printed on the selected identification document.',
      documentHelpText: 'Upload the full document image. Ensure MRZ lines or QR codes remain readable.',
      additionalFields: [
        {
          name: 'bvn',
          label: 'Bank Verification Number (BVN)',
          placeholder: '22345678901',
          helperText: '11 digits issued by the Central Bank of Nigeria.',
          required: true,
          inputMode: 'numeric',
          maxLength: 11,
          pattern: /^\d{11}$/,
          normalize: digitsOnly,
        },
      ],
      idNumberPatternMessage: 'Enter the number from your Nigerian ID document.',
    },
  },
];

export const SUPPORTED_COUNTRY_MAP: Record<string, SupportedCountry> = SUPPORTED_COUNTRIES.reduce(
  (accumulator, country) => {
    accumulator[country.iso2] = country;
    return accumulator;
  },
  {} as Record<string, SupportedCountry>
);

export const DEFAULT_KYC_CONFIG: CountryKycConfig = {
  idTypes: [
    { value: 'passport', label: 'Passport' },
    { value: 'national-id', label: 'National ID' },
    { value: 'drivers-license', label: "Driver's License" },
  ],
  idNumberLabel: 'ID Number',
  idNumberDescription: 'Enter the identifier shown on your selected document.',
  documentHelpText: 'Upload a clear photo or PDF of your government-issued ID.',
};
