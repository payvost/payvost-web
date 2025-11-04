export type CurrencyMeta = {
  name: string;
  flag: string; // ISO country/region code matching public/flag assets (e.g., US, EU, GB)
};

const META: Record<string, CurrencyMeta> = {
  USD: { name: 'US Dollar', flag: 'US' },
  EUR: { name: 'Euro', flag: 'EU' },
  GBP: { name: 'British Pound', flag: 'GB' },
  NGN: { name: 'Nigerian Naira', flag: 'NG' },
  GHS: { name: 'Ghanaian Cedi', flag: 'GH' },
  KES: { name: 'Kenyan Shilling', flag: 'KE' },
  CAD: { name: 'Canadian Dollar', flag: 'CA' },
  AUD: { name: 'Australian Dollar', flag: 'AU' },
  JPY: { name: 'Japanese Yen', flag: 'JP' },
  SAR: { name: 'Saudi Riyal', flag: 'SA' },
  GEL: { name: 'Georgian Lari', flag: 'GE' },
};

export function getCurrencyMeta(code: string): CurrencyMeta {
  const upper = (code || '').toUpperCase();
  return META[upper] || { name: upper, flag: upper };
}

export function getFlagCode(code: string): string {
  return getCurrencyMeta(code).flag;
}

export function getCurrencyName(code: string): string {
  return getCurrencyMeta(code).name;
}
