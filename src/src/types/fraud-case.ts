

export type FraudCaseStatus = 'Open' | 'Resolved' | 'Watching';

export interface FraudCase {
  id: string; // The case ID
  transactionId: string;
  user: {
      id: string;
      name: string;
  };
  reason: string; // e.g., 'High velocity', 'IP Mismatch'
  riskScore: number;
  status: FraudCaseStatus;
  timestamp: string; // ISO 8601
}
