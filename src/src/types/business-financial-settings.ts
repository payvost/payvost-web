

export type PayoutSchedule = 'Daily' | 'Weekly' | 'Monthly' | 'OnDemand';

export interface FinancialSettings {
    defaultSettlementAccount: string;
    primaryOperatingAccount: string;
    payoutSchedule: PayoutSchedule;
    escrowEnabled: boolean;
}
