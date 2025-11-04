export type KycLevel = 'Basic' | 'Full' | 'Advanced';

export type KycDocKey =
  | 'government_id'
  | 'proof_of_address'
  | 'selfie'
  | 'business_registration'
  | 'tax_id'
  | 'director_id'
  | 'bank_statement'
  | 'other';

export interface KycRequirement {
  key: KycDocKey;
  label: string;
  description?: string;
  required: boolean;
  acceptedFormats?: string[]; // e.g., ['image/jpeg', 'application/pdf']
  maxSizeMB?: number;
}

export interface CountryKycConfig {
  countryCode: string; // ISO-3166 alpha-2
  countryName: string;
  levels: Record<KycLevel, KycRequirement[]>;
}

export interface KycDocument {
  key: KycDocKey;
  name: string;
  url: string;
  contentType?: string;
  size?: number; // bytes
  status?: 'submitted' | 'approved' | 'rejected';
  rejectionReason?: string;
}

export interface KycSubmission {
  id: string;
  userId: string;
  countryCode: string;
  level: KycLevel;
  documents: KycDocument[];
  status: 'submitted' | 'in_review' | 'approved' | 'rejected';
  createdAt: string; // ISO
  decidedAt?: string;
  decidedBy?: string;
  rejectionReason?: string;
}

export interface KycDecisionInput {
  submissionId: string;
  decision: 'approved' | 'rejected';
  reason?: string;
}
