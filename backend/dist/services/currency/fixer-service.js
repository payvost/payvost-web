"use strict";
// Fixer.io API Service
// Provides real-time exchange rates from Fixer.io
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLatestRates = getLatestRates;
exports.convertCurrency = convertCurrency;
exports.getHistoricalRates = getHistoricalRates;
exports.getTimeSeriesRates = getTimeSeriesRates;
exports.getSupportedCurrencies = getSupportedCurrencies;
const decimal_js_1 = __importDefault(require("decimal.js"));
const FIXER_API_KEY = process.env.FIXER_API_KEY;
const FIXER_BASE_URL = 'https://api.fixer.io/';
/**
 * Get latest exchange rates from Fixer.io
 * @param base Base currency (default: EUR for free plan)
 * @param symbols Optional array of target currencies
 */
async function getLatestRates(base = 'EUR', symbols) {
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
    const data = await response.json();
    if (!data.success) {
        throw new Error('Failed to fetch exchange rates from Fixer.io');
    }
    // Convert rates to Decimal for precision
    const rates = {};
    for (const [currency, rate] of Object.entries(data.rates)) {
        rates[currency] = new decimal_js_1.default(rate);
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
async function convertCurrency(from, to, amount) {
    if (!FIXER_API_KEY) {
        throw new Error('FIXER_API_KEY is not configured');
    }
    const amountDecimal = amount instanceof decimal_js_1.default ? amount : new decimal_js_1.default(amount);
    const url = new URL(`${FIXER_BASE_URL}convert`);
    url.searchParams.append('access_key', FIXER_API_KEY);
    url.searchParams.append('from', from);
    url.searchParams.append('to', to);
    url.searchParams.append('amount', amountDecimal.toString());
    const response = await fetch(url.toString());
    if (!response.ok) {
        throw new Error(`Fixer API error: ${response.statusText}`);
    }
    const data = await response.json();
    if (!data.success) {
        throw new Error('Failed to convert currency via Fixer.io');
    }
    return {
        from: data.query.from,
        to: data.query.to,
        amount: amountDecimal,
        result: new decimal_js_1.default(data.result),
        rate: new decimal_js_1.default(data.info.rate),
        timestamp: data.info.timestamp,
    };
}
/**
 * Get historical rates for a specific date
 * @param date Date in YYYY-MM-DD format
 * @param base Base currency
 * @param symbols Optional array of target currencies
 */
async function getHistoricalRates(date, base = 'EUR', symbols) {
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
    const data = await response.json();
    if (!data.success) {
        throw new Error('Failed to fetch historical rates from Fixer.io');
    }
    // Convert rates to Decimal for precision
    const rates = {};
    for (const [currency, rate] of Object.entries(data.rates)) {
        rates[currency] = new decimal_js_1.default(rate);
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
async function getTimeSeriesRates(startDate, endDate, base = 'EUR', symbols) {
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
    const data = await response.json();
    if (!data.success) {
        throw new Error('Failed to fetch time series rates from Fixer.io');
    }
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
 * Check if a currency is supported by Fixer.io
 */
async function getSupportedCurrencies() {
    if (!FIXER_API_KEY) {
        throw new Error('FIXER_API_KEY is not configured');
    }
    const url = new URL(`${FIXER_BASE_URL}symbols`);
    url.searchParams.append('access_key', FIXER_API_KEY);
    const response = await fetch(url.toString());
    if (!response.ok) {
        throw new Error(`Fixer API error: ${response.statusText}`);
    }
    const data = await response.json();
    if (!data.success) {
        throw new Error('Failed to fetch supported currencies from Fixer.io');
    }
    return Object.keys(data.symbols);
}
