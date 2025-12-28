// Open Exchange Rates API Service
// Provides real-time exchange rates from openexchangerates.org

import Decimal from 'decimal.js';

const OXR_APP_ID = process.env.OPEN_EXCHANGE_RATES_APP_ID;
const OXR_BASE_URL = 'https://openexchangerates.org/api/';

interface OXRResponse {
    disclaimer: string;
    license: string;
    timestamp: number;
    base: string;
    rates: { [key: string]: number };
}

interface OXRHistoricalResponse extends OXRResponse {
    timestamp: number;
}

interface OXRTimeSeriesResponse {
    disclaimer: string;
    license: string;
    start_date: string;
    end_date: string;
    base: string;
    rates: {
        [date: string]: {
            [currency: string]: number;
        };
    };
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
 * Get latest exchange rates from Open Exchange Rates
 * @param base Base currency (default: USD, requires paid plan for other bases)
 * @param symbols Optional array of target currencies
 */
export async function getLatestRates(
    base: string = 'USD',
    symbols?: string[]
): Promise<ExchangeRateResult> {
    if (!OXR_APP_ID) {
        throw new Error('OPEN_EXCHANGE_RATES_APP_ID is not configured');
    }

    const url = new URL(`${OXR_BASE_URL}latest.json`);
    url.searchParams.append('app_id', OXR_APP_ID);

    // Note: base currency change requires paid plan
    if (base !== 'USD') {
        url.searchParams.append('base', base);
    }

    if (symbols && symbols.length > 0) {
        url.searchParams.append('symbols', symbols.join(','));
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `OpenExchangeRates API error: ${response.statusText}`);
    }

    const data: OXRResponse = await response.json();

    // Convert rates to Decimal for precision
    const rates: { [key: string]: Decimal } = {};
    for (const [currency, rate] of Object.entries(data.rates)) {
        rates[currency] = new Decimal(rate);
    }

    return {
        base: data.base,
        rates,
        timestamp: data.timestamp,
        date: new Date(data.timestamp * 1000).toISOString().split('T')[0],
    };
}

/**
 * Convert amount from one currency to another
 * Uses latest rates to calculate conversion
 * @param from Source currency
 * @param to Target currency
 * @param amount Amount to convert
 */
export async function convertCurrency(
    from: string,
    to: string,
    amount: number | Decimal
): Promise<ConversionResult> {
    if (!OXR_APP_ID) {
        throw new Error('OPEN_EXCHANGE_RATES_APP_ID is not configured');
    }

    const amountDecimal = amount instanceof Decimal ? amount : new Decimal(amount);

    // Get latest rates for both currencies
    const ratesData = await getLatestRates('USD', [from, to]);

    if (!ratesData.rates[from] || !ratesData.rates[to]) {
        throw new Error(`Currency ${from} or ${to} not found in rates`);
    }

    // Calculate cross rate: (amount in USD) * (to rate) / (from rate)
    const fromRate = ratesData.rates[from];
    const toRate = ratesData.rates[to];

    // Convert to USD first, then to target currency
    const amountInUSD = amountDecimal.div(fromRate);
    const result = amountInUSD.mul(toRate);
    const rate = toRate.div(fromRate);

    return {
        from,
        to,
        amount: amountDecimal,
        result,
        rate,
        timestamp: ratesData.timestamp,
    };
}

/**
 * Get historical rates for a specific date
 * @param date Date in YYYY-MM-DD format
 * @param base Base currency (USD for free plan)
 * @param symbols Optional array of target currencies
 */
export async function getHistoricalRates(
    date: string,
    base: string = 'USD',
    symbols?: string[]
): Promise<ExchangeRateResult> {
    if (!OXR_APP_ID) {
        throw new Error('OPEN_EXCHANGE_RATES_APP_ID is not configured');
    }

    const url = new URL(`${OXR_BASE_URL}historical/${date}.json`);
    url.searchParams.append('app_id', OXR_APP_ID);

    if (base !== 'USD') {
        url.searchParams.append('base', base);
    }

    if (symbols && symbols.length > 0) {
        url.searchParams.append('symbols', symbols.join(','));
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `OpenExchangeRates API error: ${response.statusText}`);
    }

    const data: OXRHistoricalResponse = await response.json();

    // Convert rates to Decimal for precision
    const rates: { [key: string]: Decimal } = {};
    for (const [currency, rate] of Object.entries(data.rates)) {
        rates[currency] = new Decimal(rate);
    }

    return {
        base: data.base,
        rates,
        timestamp: data.timestamp,
        date: new Date(data.timestamp * 1000).toISOString().split('T')[0],
    };
}

/**
 * Get time series data for a date range
 * Note: Requires paid plan
 * @param startDate Start date in YYYY-MM-DD format
 * @param endDate End date in YYYY-MM-DD format
 * @param base Base currency
 * @param symbols Optional array of target currencies
 */
export async function getTimeSeriesRates(
    startDate: string,
    endDate: string,
    base: string = 'USD',
    symbols?: string[]
): Promise<{ [date: string]: { [currency: string]: Decimal } }> {
    if (!OXR_APP_ID) {
        throw new Error('OPEN_EXCHANGE_RATES_APP_ID is not configured');
    }

    const url = new URL(`${OXR_BASE_URL}time-series.json`);
    url.searchParams.append('app_id', OXR_APP_ID);
    url.searchParams.append('start', startDate);
    url.searchParams.append('end', endDate);

    if (base !== 'USD') {
        url.searchParams.append('base', base);
    }

    if (symbols && symbols.length > 0) {
        url.searchParams.append('symbols', symbols.join(','));
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `OpenExchangeRates API error: ${response.statusText}`);
    }

    const data: OXRTimeSeriesResponse = await response.json();

    // Convert rates to Decimal for precision
    const timeSeries: { [date: string]: { [currency: string]: Decimal } } = {};

    for (const [date, rates] of Object.entries(data.rates)) {
        timeSeries[date] = {};
        for (const [currency, rate] of Object.entries(rates)) {
            timeSeries[date][currency] = new Decimal(rate);
        }
    }

    return timeSeries;
}

/**
 * Get list of all available currencies
 */
export async function getSupportedCurrencies(): Promise<{ [code: string]: string }> {
    if (!OXR_APP_ID) {
        throw new Error('OPEN_EXCHANGE_RATES_APP_ID is not configured');
    }

    const url = new URL(`${OXR_BASE_URL}currencies.json`);
    url.searchParams.append('app_id', OXR_APP_ID);

    const response = await fetch(url.toString());

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `OpenExchangeRates API error: ${response.statusText}`);
    }

    const currencies: { [code: string]: string } = await response.json();
    return currencies;
}

/**
 * Get usage statistics (helpful for monitoring API limits)
 */
export async function getUsageStats(): Promise<any> {
    if (!OXR_APP_ID) {
        throw new Error('OPEN_EXCHANGE_RATES_APP_ID is not configured');
    }

    const url = new URL(`${OXR_BASE_URL}usage.json`);
    url.searchParams.append('app_id', OXR_APP_ID);

    const response = await fetch(url.toString());

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `OpenExchangeRates API error: ${response.statusText}`);
    }

    return await response.json();
}
