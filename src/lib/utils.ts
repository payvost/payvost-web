import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function abbreviateNumber(value: number): string {
  if (value < 1000) {
    return value.toString();
  }

  const suffixes = ["", "K", "M", "B", "T"];
  const suffixNum = Math.floor(Math.log10(value) / 3);
  let shortValue = value / Math.pow(1000, suffixNum);

  // Use toFixed(1) for values that are not whole numbers after scaling
  if (shortValue % 1 !== 0) {
    shortValue = parseFloat(shortValue.toFixed(1));
  }
  
  return shortValue + suffixes[suffixNum];
}

/**
 * Format a number as currency
 */
export function formatCurrency(amount: number | string, currency: string = 'USD'): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    // Prefer real symbols (e.g. ₦, GH₵) over ISO codes (e.g. NGN, GHS) for consistency in UI.
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
}
