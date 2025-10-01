
export type RateStatus = 'Active' | 'Paused';

export interface ForexRate {
  id: string;
  currencyPair: string; // e.g., 'USD/NGN'
  baseRate: number; // Rate from the provider
  markup: number; // Markup in percentage
  customerRate: number; // Final rate (baseRate * (1 + markup/100))
  status: RateStatus;
  lastUpdated: string; // ISO 8601 timestamp
}
