
import type { KycStatus } from './kyc';

export interface BusinessProfile {
    legalName: string;
    industry: string;
    businessType: string;
    registrationNumber?: string;
    taxId?: string;
    businessAddress: string;
    website?: string;
    logoUrl?: string;
    kycStatus: Extract<KycStatus, 'verified' | 'pending' | 'rejected'>;
}
