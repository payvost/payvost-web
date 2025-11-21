import type { CountryKycConfig } from '@/types/kyc';

export const KYC_CONFIG: CountryKycConfig[] = [
  {
    countryCode: 'NG',
    countryName: 'Nigeria',
    requirements: [
      { key: 'government_id', label: 'Government ID (NIN/Passport)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'proof_of_address', label: 'Proof of Address (3 months)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'selfie', label: 'Selfie Photo', required: true, acceptedFormats: ['image/jpeg','image/png'], maxSizeMB: 5 },
    ],
  },
  {
    countryCode: 'US',
    countryName: 'United States',
    requirements: [
      { key: 'government_id', label: 'Government ID (Driver License/Passport)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'proof_of_address', label: 'Proof of Address (3 months)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'selfie', label: 'Selfie Photo', required: true, acceptedFormats: ['image/jpeg','image/png'], maxSizeMB: 5 },
    ],
  },
  {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    requirements: [
      { key: 'government_id', label: 'Government ID (Passport/Driving License)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'proof_of_address', label: 'Proof of Address (3 months)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'selfie', label: 'Selfie Photo', required: true, acceptedFormats: ['image/jpeg','image/png'], maxSizeMB: 5 },
    ],
  },
  {
    countryCode: 'CA',
    countryName: 'Canada',
    requirements: [
      { key: 'government_id', label: 'Government ID (Passport/Driving License)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'proof_of_address', label: 'Proof of Address (3 months)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'selfie', label: 'Selfie Photo', required: true, acceptedFormats: ['image/jpeg','image/png'], maxSizeMB: 5 },
    ],
  },
  {
    countryCode: 'AU',
    countryName: 'Australia',
    requirements: [
      { key: 'government_id', label: 'Government ID (Passport/Driver License/Medicare Card)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'proof_of_address', label: 'Proof of Address (3 months)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'selfie', label: 'Selfie Photo', required: true, acceptedFormats: ['image/jpeg','image/png'], maxSizeMB: 5 },
    ],
  },
  {
    countryCode: 'KE',
    countryName: 'Kenya',
    requirements: [
      { key: 'government_id', label: 'Government ID (National ID/Passport)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'proof_of_address', label: 'Proof of Address (3 months)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'selfie', label: 'Selfie Photo', required: true, acceptedFormats: ['image/jpeg','image/png'], maxSizeMB: 5 },
    ],
  },
  {
    countryCode: 'GH',
    countryName: 'Ghana',
    requirements: [
      { key: 'government_id', label: 'Government ID (Ghana Card/Passport)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'proof_of_address', label: 'Proof of Address (3 months)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'selfie', label: 'Selfie Photo', required: true, acceptedFormats: ['image/jpeg','image/png'], maxSizeMB: 5 },
    ],
  },
  {
    countryCode: 'ZA',
    countryName: 'South Africa',
    requirements: [
      { key: 'government_id', label: 'Government ID (ID Book/Passport)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'proof_of_address', label: 'Proof of Address (3 months)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'selfie', label: 'Selfie Photo', required: true, acceptedFormats: ['image/jpeg','image/png'], maxSizeMB: 5 },
    ],
  },
  {
    countryCode: 'TZ',
    countryName: 'Tanzania',
    requirements: [
      { key: 'government_id', label: 'Government ID (National ID/Passport)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'proof_of_address', label: 'Proof of Address (3 months)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'selfie', label: 'Selfie Photo', required: true, acceptedFormats: ['image/jpeg','image/png'], maxSizeMB: 5 },
    ],
  },
  {
    countryCode: 'UG',
    countryName: 'Uganda',
    requirements: [
      { key: 'government_id', label: 'Government ID (National ID/Passport)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'proof_of_address', label: 'Proof of Address (3 months)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'selfie', label: 'Selfie Photo', required: true, acceptedFormats: ['image/jpeg','image/png'], maxSizeMB: 5 },
    ],
  },
  {
    countryCode: 'IN',
    countryName: 'India',
    requirements: [
      { key: 'government_id', label: 'Government ID (Aadhaar/PAN/Passport)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'proof_of_address', label: 'Proof of Address (3 months)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'selfie', label: 'Selfie Photo', required: true, acceptedFormats: ['image/jpeg','image/png'], maxSizeMB: 5 },
    ],
  },
  {
    countryCode: 'PK',
    countryName: 'Pakistan',
    requirements: [
      { key: 'government_id', label: 'Government ID (CNIC/Passport)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'proof_of_address', label: 'Proof of Address (3 months)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'selfie', label: 'Selfie Photo', required: true, acceptedFormats: ['image/jpeg','image/png'], maxSizeMB: 5 },
    ],
  },
  {
    countryCode: 'BD',
    countryName: 'Bangladesh',
    requirements: [
      { key: 'government_id', label: 'Government ID (NID/Passport)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'proof_of_address', label: 'Proof of Address (3 months)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'selfie', label: 'Selfie Photo', required: true, acceptedFormats: ['image/jpeg','image/png'], maxSizeMB: 5 },
    ],
  },
  {
    countryCode: 'PH',
    countryName: 'Philippines',
    requirements: [
      { key: 'government_id', label: 'Government ID (National ID/Passport)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'proof_of_address', label: 'Proof of Address (3 months)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'selfie', label: 'Selfie Photo', required: true, acceptedFormats: ['image/jpeg','image/png'], maxSizeMB: 5 },
    ],
  },
  {
    countryCode: 'ID',
    countryName: 'Indonesia',
    requirements: [
      { key: 'government_id', label: 'Government ID (KTP/Passport)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'proof_of_address', label: 'Proof of Address (3 months)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'selfie', label: 'Selfie Photo', required: true, acceptedFormats: ['image/jpeg','image/png'], maxSizeMB: 5 },
    ],
  },
  {
    countryCode: 'MY',
    countryName: 'Malaysia',
    requirements: [
      { key: 'government_id', label: 'Government ID (MyKad/Passport)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'proof_of_address', label: 'Proof of Address (3 months)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'selfie', label: 'Selfie Photo', required: true, acceptedFormats: ['image/jpeg','image/png'], maxSizeMB: 5 },
    ],
  },
  {
    countryCode: 'SG',
    countryName: 'Singapore',
    requirements: [
      { key: 'government_id', label: 'Government ID (NRIC/Passport)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'proof_of_address', label: 'Proof of Address (3 months)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'selfie', label: 'Selfie Photo', required: true, acceptedFormats: ['image/jpeg','image/png'], maxSizeMB: 5 },
    ],
  },
  {
    countryCode: 'DE',
    countryName: 'Germany',
    requirements: [
      { key: 'government_id', label: 'Government ID (ID Card/Passport)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'proof_of_address', label: 'Proof of Address (3 months)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'selfie', label: 'Selfie Photo', required: true, acceptedFormats: ['image/jpeg','image/png'], maxSizeMB: 5 },
    ],
  },
  {
    countryCode: 'FR',
    countryName: 'France',
    requirements: [
      { key: 'government_id', label: 'Government ID (ID Card/Passport)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'proof_of_address', label: 'Proof of Address (3 months)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'selfie', label: 'Selfie Photo', required: true, acceptedFormats: ['image/jpeg','image/png'], maxSizeMB: 5 },
    ],
  },
  {
    countryCode: 'ES',
    countryName: 'Spain',
    requirements: [
      { key: 'government_id', label: 'Government ID (DNI/Passport)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'proof_of_address', label: 'Proof of Address (3 months)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'selfie', label: 'Selfie Photo', required: true, acceptedFormats: ['image/jpeg','image/png'], maxSizeMB: 5 },
    ],
  },
  {
    countryCode: 'IT',
    countryName: 'Italy',
    requirements: [
      { key: 'government_id', label: 'Government ID (ID Card/Passport)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'proof_of_address', label: 'Proof of Address (3 months)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'selfie', label: 'Selfie Photo', required: true, acceptedFormats: ['image/jpeg','image/png'], maxSizeMB: 5 },
    ],
  },
  {
    countryCode: 'NL',
    countryName: 'Netherlands',
    requirements: [
      { key: 'government_id', label: 'Government ID (ID Card/Passport)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'proof_of_address', label: 'Proof of Address (3 months)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'selfie', label: 'Selfie Photo', required: true, acceptedFormats: ['image/jpeg','image/png'], maxSizeMB: 5 },
    ],
  },
  {
    countryCode: 'BR',
    countryName: 'Brazil',
    requirements: [
      { key: 'government_id', label: 'Government ID (CPF/RG/Passport)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'proof_of_address', label: 'Proof of Address (3 months)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'selfie', label: 'Selfie Photo', required: true, acceptedFormats: ['image/jpeg','image/png'], maxSizeMB: 5 },
    ],
  },
  {
    countryCode: 'MX',
    countryName: 'Mexico',
    requirements: [
      { key: 'government_id', label: 'Government ID (INE/Passport)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'proof_of_address', label: 'Proof of Address (3 months)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'selfie', label: 'Selfie Photo', required: true, acceptedFormats: ['image/jpeg','image/png'], maxSizeMB: 5 },
    ],
  },
  {
    countryCode: 'AR',
    countryName: 'Argentina',
    requirements: [
      { key: 'government_id', label: 'Government ID (DNI/Passport)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'proof_of_address', label: 'Proof of Address (3 months)', required: true, acceptedFormats: ['image/jpeg','image/png','application/pdf'], maxSizeMB: 10 },
      { key: 'selfie', label: 'Selfie Photo', required: true, acceptedFormats: ['image/jpeg','image/png'], maxSizeMB: 5 },
    ],
  },
];

export const getKycConfig = (countryCode: string) =>
  KYC_CONFIG.find(c => c.countryCode.toUpperCase() === countryCode.toUpperCase()) || null;
