/**
 * KYC Verification Types and Interfaces
 * Core types for verification system
 */

export type KycTier = 'tier1' | 'tier2' | 'tier3';
export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'pending_review' | 'requires_resubmission';

export type VerificationProviderName = 'sumsub' | 'dojah' | 'complyadvantage' | 'firebase' | 'twilio';

export interface VerificationResult {
  success: boolean;
  confidence?: number; // 0-100
  provider: VerificationProviderName;
  data?: Record<string, unknown>;
  error?: string;
  verifiedAt?: Date;
}

export interface IDVerificationResult extends VerificationResult {
  extractedData?: {
    fullName?: string;
    dateOfBirth?: string;
    idNumber?: string;
    expiryDate?: string;
    documentType?: string;
    country?: string;
  };
  isExpired?: boolean;
  isTampered?: boolean;
}

export interface FaceMatchResult extends VerificationResult {
  matchScore?: number; // 0-1
  isMatch?: boolean;
  livenessCheck?: boolean;
}

export interface AddressVerificationResult extends VerificationResult {
  extractedAddress?: string;
  matchesProvidedAddress?: boolean;
  addressMatchScore?: number; // 0-1
}

export interface TaxIDVerificationResult extends VerificationResult {
  taxIdType?: string;
  isValid?: boolean;
  nameMatch?: boolean;
}

export interface AMLScreeningResult extends VerificationResult {
  riskScore?: number; // 0-100
  isSanctioned?: boolean;
  isPEP?: boolean;
  isAdverseMedia?: boolean;
  matches?: Array<{
    type: 'sanctions' | 'pep' | 'adverse_media' | 'watchlist';
    score: number;
    details: string;
  }>;
}

export interface EmailVerificationResult extends VerificationResult {
  isDeliverable?: boolean;
  isDisposable?: boolean;
  isDomainValid?: boolean;
}

export interface PhoneVerificationResult extends VerificationResult {
  isValid?: boolean;
  carrier?: string;
  country?: string;
  isMobile?: boolean;
}

export interface VerificationProvider {
  name: VerificationProviderName;
  verifyID?(document: File, country: string, metadata?: Record<string, unknown>): Promise<IDVerificationResult>;
  verifyFaceMatch?(selfie: File, idDocument: File, metadata?: Record<string, unknown>): Promise<FaceMatchResult>;
  verifyAddress?(
    addressDoc: File,
    providedAddress: string,
    country: string,
    metadata?: Record<string, unknown>
  ): Promise<AddressVerificationResult>;
  verifyTaxID?(taxId: string, country: string, name?: string, metadata?: Record<string, unknown>): Promise<TaxIDVerificationResult>;
  verifyEmail?(email: string, metadata?: Record<string, unknown>): Promise<EmailVerificationResult>;
  verifyPhone?(phone: string, country: string, metadata?: Record<string, unknown>): Promise<PhoneVerificationResult>;
  runAMLScreening?(
    name: string,
    dateOfBirth?: string,
    country?: string,
    metadata?: Record<string, unknown>
  ): Promise<AMLScreeningResult>;
}

export interface KycVerificationDetails {
  email?: {
    verified: boolean;
    verifiedAt?: Date;
    provider?: VerificationProviderName;
    result?: EmailVerificationResult;
  };
  phone?: {
    verified: boolean;
    verifiedAt?: Date;
    provider?: VerificationProviderName;
    method?: 'SMS' | 'Call';
    result?: PhoneVerificationResult;
  };
  idDocument?: {
    verified: boolean;
    confidence?: number;
    extractedData?: IDVerificationResult['extractedData'];
    provider?: VerificationProviderName;
    verifiedAt?: Date;
    result?: IDVerificationResult;
  };
  faceMatch?: {
    verified: boolean;
    confidence?: number;
    matchScore?: number;
    livenessCheck?: boolean;
    provider?: VerificationProviderName;
    verifiedAt?: Date;
    result?: FaceMatchResult;
  };
  address?: {
    verified: boolean;
    confidence?: number;
    extractedAddress?: string;
    matchesProvidedAddress?: boolean;
    provider?: VerificationProviderName;
    verifiedAt?: Date;
    result?: AddressVerificationResult;
  };
  taxID?: {
    verified: boolean;
    country?: string;
    taxIdType?: string;
    provider?: VerificationProviderName;
    verifiedAt?: Date;
    result?: TaxIDVerificationResult;
  };
  amlScreening?: {
    status: 'passed' | 'failed' | 'pending' | 'flagged';
    riskScore?: number;
    isSanctioned?: boolean;
    isPEP?: boolean;
    isAdverseMedia?: boolean;
    flags?: string[];
    provider?: VerificationProviderName;
    screenedAt?: Date;
    result?: AMLScreeningResult;
  };
}

export interface KycVerificationResult {
  userId: string;
  submissionId: string;
  tier: KycTier;
  country: string;
  status: VerificationStatus;
  verificationDetails: KycVerificationDetails;
  autoApproved: boolean;
  confidenceScore?: number; // Overall 0-100
  reviewedBy?: string;
  reviewedAt?: Date;
  rejectionReason?: string;
  requiresManualReview: boolean;
  createdAt: Date;
  updatedAt: Date;
}

