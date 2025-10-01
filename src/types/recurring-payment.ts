
import type { Timestamp } from 'firebase/firestore';

export type RecurringPaymentStatus = 'Active' | 'Paused' | 'Cancelled' | 'Completed';
export type RecurringPaymentFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringPayment {
  id: string;
  recipient: string;
  amount: number;
  currency: string;
  frequency: RecurringPaymentFrequency;
  startDate: Timestamp;
  endDate?: Timestamp | null;
  notes?: string;
  status: RecurringPaymentStatus;
  createdAt: Timestamp;
  transactionHistory: {
      id: string;
      date: Timestamp;
      status: 'Success' | 'Failed';
      amount: number;
  }[];
}
