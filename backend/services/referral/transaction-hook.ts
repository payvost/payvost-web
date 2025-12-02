import { referralService } from './index';
import { Decimal } from 'decimal.js';

/**
 * Hook to be called when a transaction is completed
 * This will check if it's the user's first transaction and process referral rewards
 */
export async function onTransactionCompleted(
  userId: string,
  amount: number | string | Decimal,
  currency: string
): Promise<void> {
  try {
    const amountDecimal = typeof amount === 'string' || typeof amount === 'number'
      ? new Decimal(amount)
      : amount;

    await referralService.processFirstTransaction(userId, amountDecimal, currency);
  } catch (error) {
    // Don't fail transaction if referral processing fails
    console.error('Error processing referral reward for transaction:', error);
  }
}

