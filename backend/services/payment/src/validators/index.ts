import { Currency } from '../interfaces';

const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'NGN'];

export function validateAmount(amount: number) {
  if (typeof amount !== 'number' || isNaN(amount)) {
    throw new Error('Invalid amount');
  }
  
  if (amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }
  
  // Check for precision (max 2 decimal places)
  if (Math.round(amount * 100) / 100 !== amount) {
    throw new Error('Amount cannot have more than 2 decimal places');
  }
}

export function validateCurrency(currency: Currency) {
  if (!SUPPORTED_CURRENCIES.includes(currency)) {
    throw new Error(`Unsupported currency: ${currency}`);
  }
}

export async function validateIdempotencyKey(idempotencyKey: string) {
  if (!idempotencyKey || typeof idempotencyKey !== 'string') {
    throw new Error('Valid idempotency key is required');
  }
  
  // Check if this key has been used before
  // This would typically check against a database
  // return !await db.payments.exists({ idempotencyKey });
}