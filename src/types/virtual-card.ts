
export type CardTheme = 'blue' | 'purple' | 'green' | 'black';
export type CardStatus = 'active' | 'frozen' | 'terminated';
export type CardType = 'visa' | 'mastercard';
export type SpendingInterval = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all_time';
export type CardModel = 'debit' | 'credit';

export interface CardTransaction {
    id: string;
    description: string;
    amount: number;
    date: string;
}

export interface SpendingLimit {
    amount?: number;
    interval: SpendingInterval;
}

export interface VirtualCardData {
    id: string;
    cardLabel: string;
    last4: string;
    cardType: CardType;
    expiry: string;
    cvv: string;
    balance: number;
    currency: string;
    theme: CardTheme;
    status: CardStatus;
    fullNumber: string;
    transactions: CardTransaction[];
    spendingLimit?: SpendingLimit;
    cardModel?: CardModel;
    availableCredit?: number;
}
