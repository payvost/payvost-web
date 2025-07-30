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
