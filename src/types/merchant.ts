
export type MerchantStatus = 'Active' | 'Restricted' | 'Payouts Held' | 'Suspended';
export type ComplianceStatus = 'Verified' | 'Pending' | 'Needs Review';
export type PayoutSchedule = 'Daily' | 'Weekly' | 'Monthly';

interface MerchantTransaction {
    id: string;
    amount: number;
    currency: string;
    status: 'succeeded' | 'pending' | 'failed';
    date: string;
}

export interface MerchantAccountData {
  id: string;
  name: string;
  status: MerchantStatus;
  balance: number;
  currency: string;
  payoutSchedule: PayoutSchedule;
  onboardedDate: string;
  complianceStatus: ComplianceStatus;
  platformFee: number;
  transactions: MerchantTransaction[];
  contactEmail?: string;
  website?: string;
}
