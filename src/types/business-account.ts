import type { KycStatus } from './kyc';

export type BusinessVerificationStatus = Extract<KycStatus, 'verified' | 'pending' | 'restricted' | 'rejected'>;
export type BusinessKycTier = 'Tier 1' | 'Tier 2' | 'Tier 3';

export interface BusinessAccountData {
  id: string;
  businessName: string;
  sector: string;
  onboardingDate: string;
  country: string;
  countryCode: string; // e.g., 'NG', 'US'
  verificationStatus: BusinessVerificationStatus;
  kycTier: BusinessKycTier;
  contactEmail: string;
  paymentVolume: number;
  disputeRatio: number;
  owner: {
    id: string;
    name: string;
  };
  activityLog: {
      action: string;
      date: string;
      actor: string;
  }[];
  documents: {
      name: string;
      status: 'Approved' | 'Pending' | 'Rejected';
      url: string;
  }[];
}
