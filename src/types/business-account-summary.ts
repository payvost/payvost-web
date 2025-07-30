
export interface BusinessAccount {
  id: string;
  name: string;
  balance: number;
  currency: string;
  description: string;
}

export interface AccountTransaction {
  id: string;
  type: 'Credit' | 'Debit';
  description: string;
  category: 'Payout' | 'Invoice Payment' | 'Fees' | 'Refund';
  amount: number;
  date: string; // ISO 8601
  status: 'Completed' | 'Pending' | 'Failed';
}
