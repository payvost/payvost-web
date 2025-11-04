import type { CountryKycConfig } from '@/types/kyc';

export const KYC_CONFIG: CountryKycConfig[] = [
  {
    countryCode: 'NG',
    countryName: 'Nigeria',
    levels: {
      Basic: [
        { key: 'government_id', label: 'Government ID (NIN/Passport)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
        { key: 'selfie', label: 'Selfie Photo', required: true, acceptedFormats: ['image/jpeg','image/png'], maxSizeMB: 5 },
      ],
      Full: [
        { key: 'government_id', label: 'Government ID (NIN/Passport)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
        { key: 'proof_of_address', label: 'Proof of Address (3 months)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
        { key: 'selfie', label: 'Selfie Photo', required: true, acceptedFormats: ['image/jpeg','image/png'], maxSizeMB: 5 },
      ],
      Advanced: [
        { key: 'government_id', label: 'Government ID (NIN/Passport)', required: true },
        { key: 'proof_of_address', label: 'Proof of Address (3 months)', required: true },
        { key: 'bank_statement', label: 'Bank Statement (6 months)', required: true },
        { key: 'selfie', label: 'Selfie Photo', required: true },
      ],
    },
  },
  {
    countryCode: 'US',
    countryName: 'United States',
    levels: {
      Basic: [
        { key: 'government_id', label: 'Government ID (Driver License/Passport)', required: true },
        { key: 'selfie', label: 'Selfie Photo', required: true },
      ],
      Full: [
        { key: 'government_id', label: 'Government ID', required: true },
        { key: 'proof_of_address', label: 'Proof of Address (3 months)', required: true },
        { key: 'selfie', label: 'Selfie Photo', required: true },
      ],
      Advanced: [
        { key: 'government_id', label: 'Government ID', required: true },
        { key: 'proof_of_address', label: 'Proof of Address (3 months)', required: true },
        { key: 'bank_statement', label: 'Bank Statement (6 months)', required: true },
        { key: 'selfie', label: 'Selfie Photo', required: true },
      ],
    }
  },
  {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    levels: {
      Basic: [
        { key: 'government_id', label: 'Government ID', required: true },
        { key: 'selfie', label: 'Selfie Photo', required: true },
      ],
      Full: [
        { key: 'government_id', label: 'Government ID', required: true },
        { key: 'proof_of_address', label: 'Proof of Address (3 months)', required: true },
        { key: 'selfie', label: 'Selfie Photo', required: true },
      ],
      Advanced: [
        { key: 'government_id', label: 'Government ID', required: true },
        { key: 'proof_of_address', label: 'Proof of Address (3 months)', required: true },
        { key: 'bank_statement', label: 'Bank Statement (6 months)', required: true },
        { key: 'selfie', label: 'Selfie Photo', required: true },
      ],
    }
  }
];

export const getKycConfig = (countryCode: string) =>
  KYC_CONFIG.find(c => c.countryCode.toUpperCase() === countryCode.toUpperCase()) || null;
