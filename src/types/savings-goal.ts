
import type { Timestamp } from 'firebase/firestore';

export type SavingsFrequency = 'daily' | 'weekly' | 'monthly';
export type GoalStatus = 'active' | 'paused' | 'completed';

export interface SavingsGoal {
  id: string;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  emoji: string;
  frequency: SavingsFrequency;
  debitAmount: number;
  autoDebit: boolean;
  startDate: Timestamp;
  durationInMonths: number;
  status: GoalStatus;
  createdAt: Timestamp;
}
