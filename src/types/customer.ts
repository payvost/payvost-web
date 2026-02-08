

import type { Timestamp } from "firebase/firestore";
import type { KycStatus } from './kyc';

export type { KycStatus };

export type UserType = 'Pending' | 'Tier 1' | 'Tier 2' | 'Business Owner' | 'Business Pending';

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
    kycLevel?: 'Basic' | 'Full' | 'Advanced';
    kycIdType?: string; // e.g., NIN, Passport, Driver's License
    kycIdNumber?: string;
    bvn?: string; // Bank Verification Number
    ssn?: string; // Social Security Number
    ssnLast4?: string; // Last 4 digits of SSN
    kycProfile?: {
        tiers?: {
            tier1?: { 
                status?: string; 
                submittedAt?: string | Timestamp;
                createdAt?: string | Timestamp;
                additionalFields?: Record<string, any>;
                requirements?: string[];
            };
            tier2?: { 
                status?: string; 
                submittedAt?: string | Timestamp;
                createdAt?: string | Timestamp;
                additionalFields?: Record<string, any>;
                requirements?: string[];
            };
            tier3?: { 
                status?: string; 
                submittedAt?: string | Timestamp;
                createdAt?: string | Timestamp;
                additionalFields?: Record<string, any>;
                requirements?: string[];
            };
        };
        countryIso?: string;
        countryName?: string;
        createdAt?: string | Timestamp;
    };
    dateOfBirth?: string | Timestamp;
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    kycTier?: 'tier1' | 'tier2' | 'tier3' | string;
  userType: UserType;
  riskScore: number;
  totalSpend: number;
  wallets: WalletBalance[];
  transactions: Transaction[];
  joinedDate?: string | Timestamp;
  createdAt?: string | Timestamp;
  updatedAt?: string | Timestamp;
  associatedAccounts?: AssociatedAccount[];
  pinSetupNotified?: boolean;

    // Address details
    address?: {
        street?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
    };

    // Business information (for business accounts)
    businessInfo?: {
        registeredName?: string;
        registrationNumber?: string; // CAC / EIN / VAT
        category?: string; // e.g., fintech, e-commerce
        contactPerson?: string;
        address?: {
            street?: string;
            city?: string;
            state?: string;
            postalCode?: string;
            country?: string;
        };
    };

    // Security & login
    lastLoginAt?: string | Timestamp;
    lastLoginIp?: string;
    lastLoginDevice?: string;
    loginHistory?: Array<{
        timestamp: string | Timestamp;
        ip: string;
        device?: string;
        browser?: string;
        location?: string;
    }>;
    mfaEnabled?: boolean;
    accountLocked?: boolean;
    amlFlags?: string[]; // AML/KYC alerts
    fraudLogs?: Array<{
        timestamp: string | Timestamp;
        event: string;
        detail?: string;
        severity?: 'low' | 'medium' | 'high';
    }>;
    identityVerificationLogs?: Array<{
        timestamp: string | Timestamp;
        action: string; // e.g., 'Document Upload', 'Selfie Check'
        result: string; // e.g., 'Approved', 'Rejected'
        actor?: string; // system or admin
    }>;

    // Financial overview
    transactionCounts?: {
        succeeded?: number;
        failed?: number;
        pending?: number;
    };
    paymentMethods?: Array<{
        id?: string;
        type: 'card' | 'bank' | 'virtual_account' | string;
        brand?: string; // e.g., Visa
        last4?: string;
        bankName?: string;
        accountNoMasked?: string;
        currency?: string;
        status?: 'active' | 'inactive' | 'failed' | 'pending';
    }>;
    activeServices?: string[]; // e.g., ['Virtual Card', 'API Access', 'FX Transfers']
    settlements?: Array<{
        id: string;
        date: string | Timestamp;
        amount: number;
        currency: string;
        status: 'succeeded' | 'pending' | 'failed';
    }>;

    // Analytics & insights
    monthlyVolume?: Array<{
        month: string; // Jan, Feb, ...
        income: number;
        expense: number;
    }>;
    topCounterparties?: Array<{
        name: string;
        count: number;
        volume: number;
        currency?: string;
    }>;

    // System metadata
    metadata?: {
        customerRef?: string;
        createdBy?: string;
        createdAt?: string | Timestamp;
        lastModifiedBy?: string;
        lastModifiedAt?: string | Timestamp;
        apiKeys?: Array<{
            label?: string;
            maskedKey: string;
            lastUsedAt?: string | Timestamp;
            status?: 'active' | 'revoked';
        }>;
        webhooks?: Array<{
            url: string;
            status?: string;
            createdAt?: string | Timestamp;
        }>;
    };
}
