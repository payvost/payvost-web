
export type PayoutPartnerStatus = 'Active' | 'Inactive' | 'Issues Detected';

export interface PayoutPartner {
  id: string;
  name: string;
  type: 'Global' | 'Regional (Africa)' | 'Regional (Europe)' | 'Local (DE)';
  capabilities: ('Card Payouts' | 'ACH' | 'Bank Transfers' | 'Mobile Money' | 'SEPA Transfers')[];
  status: PayoutPartnerStatus;
  successRate: number; // as a percentage
  lastValidated: string; // ISO 8601 timestamp
}
