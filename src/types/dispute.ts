

export type DisputeStatus = 'Needs response' | 'Under review' | 'Won' | 'Lost';
export type DisputeReason = 'Product not received' | 'Fraudulent' | 'Product unacceptable' | 'Duplicate' | 'Credit not processed' | 'Other';

interface DisputeEvidence {
    name: string;
    url: string;
    uploadedBy: string; // 'Customer' or Agent Name
    date: string; // ISO 8601
}

interface DisputeLog {
    user: string; // 'System', 'Customer', or Agent Name
    action: string;
    date: string; // ISO 8601
}


export interface Dispute {
  id: string; // e.g., CASE-48292
  transactionId: string;
  customerName: string;
  amount: number;
  currency: string;
  reason: DisputeReason;
  status: DisputeStatus;
  dueBy: string; // Date string
  evidence: DisputeEvidence[];
  log: DisputeLog[];
}
