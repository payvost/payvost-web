
export interface PayoutData {
    recipientType: 'saved' | 'new';
    savedRecipientId?: string;
    recipientName?: string;
    accountNumber?: string;
    bank?: string;
    amount: number;
    currency: string;
    narration?: string;
    fundingSource: 'wallet' | 'card' | 'bank';
    saveBeneficiary: boolean;
  }
  
