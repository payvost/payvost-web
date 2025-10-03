
import type { Timestamp } from "firebase/firestore";

export type KycStatus = 'Verified' | 'Pending' | 'Unverified' | 'Restricted';
export type UserType = 'Pending' | 'Tier 1' | 'Tier 2' | 'Business Owner';

interface WalletBalance {
    currency: string;
    balance: number;
}

interface Transaction {
    id: string;
    type: 'inflow' | 'outflow';
    amount: number;
    currency: string;
    status: 'succeeded' | 'pending' | 'failed';
    date: string;
}

interface AssociatedAccount {
    id: string;
    name: string;
    type: 'Business' | 'Startup' | 'VC Portfolio';
}

export interface CustomerData {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  phone: string;
  country: string;
  countryCode: string;
  kycStatus: KycStatus;
  userType: UserType;
  riskScore: number;
  totalSpend: number;
  wallets: WalletBalance[];
  transactions: Transaction[];
  joinedDate?: string | Timestamp;
  associatedAccounts?: AssociatedAccount[];
}
