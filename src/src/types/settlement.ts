
export type SettlementStatus = 'Pending' | 'In Progress' | 'Completed' | 'Failed';

export interface Settlement {
  id: string; // settlement ID
  batchId: string; // The batch this settlement belongs to
  destination: string; // e.g., Merchant Name (Stripe), User Name (Bank)
  amount: number;
  currency: string;
  status: SettlementStatus;
  createdAt: string; // ISO 8601 timestamp
  completedAt?: string; // ISO 8601 timestamp
  reason?: string; // Reason for failure
}
