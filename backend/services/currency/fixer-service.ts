// Fixer.io API Service
// Provides real-time exchange rates from Fixer.io

import { Decimal } from 'decimal.js';

const FIXER_API_KEY = process.env.FIXER_API_KEY;
const FIXER_BASE_URL = 'https://api.fixer.io/';

interface FixerResponse {
  success: boolean;
  timestamp: number;
  base: string;
  date: string;
  rates: { [key: string]: number };
}

interface FixerConvertResponse {
  success: boolean;
  query: {
    from: string;
    to: string;
    amount: number;
  };
  info: {
    timestamp: number;
    rate: number;
  };
  date: string;
  result: number;
}

interface ExchangeRateResult {
  base: string;
  rates: { [key: string]: Decimal };
  timestamp: number;
  date: string;
}

interface ConversionResult {
  from: string;
  to: string;
  amount: Decimal;
  result: Decimal;
  rate: Decimal;
  timestamp: number;
}

/**
 * Get latest exchange rates from Fixer.io
 * @param base Base currency (default: EUR for free plan)
 * @param symbols Optional array of target currencies
 */
export async function getLatestRates(
  base: string = 'EUR',
  symbols?: string[]
): Promise<ExchangeRateResult> {
  if (!FIXER_API_KEY) {
    throw new Error('FIXER_API_KEY is not configured');
  }

  const url = new URL(`${FIXER_BASE_URL}latest`);
  url.searchParams.append('access_key', FIXER_API_KEY);
  url.searchParams.append('base', base);
  
  if (symbols && symbols.length > 0) {
    url.searchParams.append('symbols', symbols.join(','));
  }

  const response = await fetch(url.toString());
  
  if (!response.ok) {
    throw new Error(`Fixer API error: ${response.statusText}`);
  }

  const data: FixerResponse = await response.json();

  if (!data.success) {
    throw new Error('Failed to fetch exchange rates from Fixer.io');
  }

  // Convert rates to Decimal for precision
  const rates: { [key: string]: Decimal } = {};
  for (const [currency, rate] of Object.entries(data.rates)) {
    rates[currency] = new Decimal(rate);
  }

  return {
    base: data.base,
    rates,
    timestamp: data.timestamp,
    date: data.date,
  };
}

/**
 * Convert amount from one currency to another
 * @param from Source currency
 * @param to Target currency
 * @param amount Amount to convert
 */
export async function convertCurrency(
  from: string,
  to: string,
  amount: number | Decimal
): Promise<ConversionResult> {
  if (!FIXER_API_KEY) {
    throw new Error('FIXER_API_KEY is not configured');
  }

  const amountDecimal = amount instanceof Decimal ? amount : new Decimal(amount);

  const url = new URL(`${FIXER_BASE_URL}convert`);
  url.searchParams.append('access_key', FIXER_API_KEY);
  url.searchParams.append('from', from);
  url.searchParams.append('to', to);
  url.searchParams.append('amount', amountDecimal.toString());

  const response = await fetch(url.toString());
  
  if (!response.ok) {
    throw new Error(`Fixer API error: ${response.statusText}`);
  }

  const data: FixerConvertResponse = await response.json();

  if (!data.success) {
    throw new Error('Failed to convert currency via Fixer.io');
  }

  return {
    from: data.query.from,
    to: data.query.to,
    amount: amountDecimal,
    result: new Decimal(data.result),
    rate: new Decimal(data.info.rate),
    timestamp: data.info.timestamp,
  };
}

/**
 * Get historical rates for a specific date
 * @param date Date in YYYY-MM-DD format
 * @param base Base currency
 * @param symbols Optional array of target currencies
 */
export async function getHistoricalRates(
  date: string,
  base: string = 'EUR',
  symbols?: string[]
): Promise<ExchangeRateResult> {
  if (!FIXER_API_KEY) {
    throw new Error('FIXER_API_KEY is not configured');
  }

  const url = new URL(`${FIXER_BASE_URL}${date}`);
  url.searchParams.append('access_key', FIXER_API_KEY);
  url.searchParams.append('base', base);
  
  if (symbols && symbols.length > 0) {
    url.searchParams.append('symbols', symbols.join(','));
  }

  const response = await fetch(url.toString());
  
  if (!response.ok) {
    throw new Error(`Fixer API error: ${response.statusText}`);
  }

  const data: FixerResponse = await response.json();

  if (!data.success) {
    throw new Error('Failed to fetch historical rates from Fixer.io');
  }

  // Convert rates to Decimal for precision
  const rates: { [key: string]: Decimal } = {};
  for (const [currency, rate] of Object.entries(data.rates)) {
    rates[currency] = new Decimal(rate);
  }

  return {
    base: data.base,
    rates,
    timestamp: data.timestamp,
    date: data.date,
  };
}

/**
 * Get time series data for a date range
 * @param startDate Start date in YYYY-MM-DD format
 * @param endDate End date in YYYY-MM-DD format
 * @param base Base currency
 * @param symbols Optional array of target currencies
 */
export async function getTimeSeriesRates(
  startDate: string,
  endDate: string,
  base: string = 'EUR',
  symbols?: string[]
): Promise<{ [date: string]: { [currency: string]: Decimal } }> {
  if (!FIXER_API_KEY) {
    throw new Error('FIXER_API_KEY is not configured');
  }

  const url = new URL(`${FIXER_BASE_URL}timeseries`);
  url.searchParams.append('access_key', FIXER_API_KEY);
  url.searchParams.append('start_date', startDate);
  url.searchParams.append('end_date', endDate);
  url.searchParams.append('base', base);
  
  if (symbols && symbols.length > 0) {
    url.searchParams.append('symbols', symbols.join(','));
  }

  const response = await fetch(url.toString());
  
  if (!response.ok) {
    throw new Error(`Fixer API error: ${response.statusText}`);
  }

  const data: any = await response.json();

  if (!data.success) {
    throw new Error('Failed to fetch time series rates from Fixer.io');
  }

  // Convert rates to Decimal for precision
  const timeSeries: { [date: string]: { [currency: string]: Decimal } } = {};
  
  for (const [date, rates] of Object.entries(data.rates as { [date: string]: { [currency: string]: number } })) {
    timeSeries[date] = {};
    for (const [currency, rate] of Object.entries(rates)) {
      timeSeries[date][currency] = new Decimal(rate);
    }
  }

  return timeSeries;
}

/**
 * Check if a currency is supported by Fixer.io
 */
export async function getSupportedCurrencies(): Promise<string[]> {
  if (!FIXER_API_KEY) {
    throw new Error('FIXER_API_KEY is not configured');
  }

  const url = new URL(`${FIXER_BASE_URL}symbols`);
  url.searchParams.append('access_key', FIXER_API_KEY);

  const response = await fetch(url.toString());
  
  if (!response.ok) {
    throw new Error(`Fixer API error: ${response.statusText}`);
  }

  const data: any = await response.json();

  if (!data.success) {
    throw new Error('Failed to fetch supported currencies from Fixer.io');
  }

  return Object.keys(data.symbols);
}
