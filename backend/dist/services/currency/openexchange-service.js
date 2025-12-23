"use strict";
// Open Exchange Rates API Service
// Provides real-time exchange rates from openexchangerates.org
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLatestRates = getLatestRates;
exports.convertCurrency = convertCurrency;
exports.getHistoricalRates = getHistoricalRates;
exports.getTimeSeriesRates = getTimeSeriesRates;
exports.getSupportedCurrencies = getSupportedCurrencies;
exports.getUsageStats = getUsageStats;
const decimal_js_1 = __importDefault(require("decimal.js"));
const OXR_APP_ID = process.env.OPEN_EXCHANGE_RATES_APP_ID;
const OXR_BASE_URL = 'https://openexchangerates.org/api/';
/**
 * Get latest exchange rates from Open Exchange Rates
 * @param base Base currency (default: USD, requires paid plan for other bases)
 * @param symbols Optional array of target currencies
 */
async function getLatestRates(base = 'USD', symbols) {
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
    const data = await response.json();
    // Convert rates to Decimal for precision
    const rates = {};
    for (const [currency, rate] of Object.entries(data.rates)) {
        rates[currency] = new decimal_js_1.default(rate);
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
async function convertCurrency(from, to, amount) {
    if (!OXR_APP_ID) {
        throw new Error('OPEN_EXCHANGE_RATES_APP_ID is not configured');
    }
    const amountDecimal = amount instanceof decimal_js_1.default ? amount : new decimal_js_1.default(amount);
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
async function getHistoricalRates(date, base = 'USD', symbols) {
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
    const data = await response.json();
    // Convert rates to Decimal for precision
    const rates = {};
    for (const [currency, rate] of Object.entries(data.rates)) {
        rates[currency] = new decimal_js_1.default(rate);
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
async function getTimeSeriesRates(startDate, endDate, base = 'USD', symbols) {
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
    const data = await response.json();
    // Convert rates to Decimal for precision
    const timeSeries = {};
    for (const [date, rates] of Object.entries(data.rates)) {
        timeSeries[date] = {};
        for (const [currency, rate] of Object.entries(rates)) {
            timeSeries[date][currency] = new decimal_js_1.default(rate);
        }
    }
    return timeSeries;
}
/**
 * Get list of all available currencies
 */
async function getSupportedCurrencies() {
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
    const currencies = await response.json();
    return currencies;
}
/**
 * Get usage statistics (helpful for monitoring API limits)
 */
async function getUsageStats() {
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
