
export type InvestmentCategory = 'Real Estate' | 'Bonds' | 'Crypto' | 'Mutual Funds' | 'Startups';
export type InvestmentRiskLevel = 'Low' | 'Medium' | 'High';

export interface InvestmentListing {
  id: string;
  title: string;
  category: InvestmentCategory;
  roi: string; // e.g., "5-7% APY"
  duration: string; // e.g., "3-5 Years"
  riskLevel: InvestmentRiskLevel;
  image: string;
  description: string;
  minInvestment: number;
}

export interface UserInvestment {
  id: string;
  listingId: string;
  amountInvested: number;
  startDate: any; // Using any to accommodate Firestore Timestamps
  status: 'Active' | 'Matured';
  currentValue: number;
}
