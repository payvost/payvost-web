"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middleware_1 = require("../../gateway/middleware");
const index_1 = require("../../gateway/index");
const decimal_js_1 = require("decimal.js");
const router = (0, express_1.Router)();
// In-memory exchange rate cache (in production, use Redis or similar)
const exchangeRateCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
/**
 * Supported currencies
 */
const SUPPORTED_CURRENCIES = [
    'USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR',
];
/**
 * GET /api/currency/rates
 * Get current exchange rates
 */
router.get('/rates', middleware_1.optionalAuth, async (req, res) => {
    try {
        const { base = 'USD', target } = req.query;
        if (!SUPPORTED_CURRENCIES.includes(base)) {
            throw new index_1.ValidationError(`Unsupported base currency: ${base}`);
        }
        if (target && !SUPPORTED_CURRENCIES.includes(target)) {
            throw new index_1.ValidationError(`Unsupported target currency: ${target}`);
        }
        const rates = await getExchangeRates(base, target);
        res.status(200).json({
            base,
            timestamp: new Date().toISOString(),
            rates,
        });
    }
    catch (error) {
        console.error('Error fetching exchange rates:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch exchange rates' });
    }
});
/**
 * POST /api/currency/convert
 * Convert amount from one currency to another
 */
router.post('/convert', middleware_1.optionalAuth, async (req, res) => {
    try {
        const { amount, from, to } = req.body;
        if (!amount || !from || !to) {
            throw new index_1.ValidationError('amount, from, and to are required');
        }
        if (!SUPPORTED_CURRENCIES.includes(from)) {
            throw new index_1.ValidationError(`Unsupported source currency: ${from}`);
        }
        if (!SUPPORTED_CURRENCIES.includes(to)) {
            throw new index_1.ValidationError(`Unsupported target currency: ${to}`);
        }
        const result = await convertCurrency({
            amount: new decimal_js_1.Decimal(amount),
            from,
            to,
        });
        res.status(200).json({
            amount: amount,
            from,
            to,
            convertedAmount: result.convertedAmount.toString(),
            rate: result.rate.toString(),
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error converting currency:', error);
        res.status(500).json({ error: error.message || 'Failed to convert currency' });
    }
});
/**
 * GET /api/currency/supported
 * Get list of supported currencies
 */
router.get('/supported', (req, res) => {
    res.status(200).json({
        currencies: SUPPORTED_CURRENCIES.map(code => ({
            code,
            name: getCurrencyName(code),
            symbol: getCurrencySymbol(code),
        })),
    });
});
/**
 * POST /api/currency/calculate-fees
 * Calculate currency conversion fees
 */
router.post('/calculate-fees', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const { amount, from, to, userTier = 'STANDARD' } = req.body;
        if (!amount || !from || !to) {
            throw new index_1.ValidationError('amount, from, and to are required');
        }
        const fees = calculateConversionFees({
            amount: new decimal_js_1.Decimal(amount),
            from,
            to,
            userTier,
        });
        res.status(200).json({
            amount: amount,
            from,
            to,
            fees: fees.totalFee.toString(),
            breakdown: {
                conversionFee: fees.conversionFee.toString(),
                markup: fees.markup.toString(),
                discount: fees.discount.toString(),
            },
            effectiveRate: fees.effectiveRate.toString(),
        });
    }
    catch (error) {
        console.error('Error calculating fees:', error);
        res.status(500).json({ error: error.message || 'Failed to calculate fees' });
    }
});
/**
 * Get exchange rates from Fixer API
 */
async function getExchangeRates(base, target) {
    // Check cache first
    const cacheKey = target ? `${base}-${target}` : `${base}-rates`;
    const cached = exchangeRateCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        const rates = {};
        if (target) {
            rates[target] = cached.rate.toString();
        }
        else {
            // Return all cached rates
            SUPPORTED_CURRENCIES.forEach(currency => {
                if (currency !== base) {
                    const cachedRate = exchangeRateCache.get(`${base}-${currency}`);
                    if (cachedRate) {
                        rates[currency] = cachedRate.rate.toString();
                    }
                }
            });
            if (Object.keys(rates).length > 0) {
                return rates;
            }
        }
        if (target && rates[target]) {
            return rates;
        }
    }
    // Fetch from Fixer API
    const FIXER_API_KEY = process.env.FIXER_API_KEY;
    if (!FIXER_API_KEY) {
        console.warn('FIXER_API_KEY not configured, using mock rates');
        return getMockRates(base, target);
    }
    try {
        const symbols = target ? target : SUPPORTED_CURRENCIES.filter(c => c !== base).join(',');
        const fixerUrl = `https://api.fixer.io/latest?access_key=${FIXER_API_KEY}&base=${base}&symbols=${symbols}`;
        const response = await fetch(fixerUrl);
        const data = await response.json();
        if (!data.success) {
            console.error('Fixer API error:', data.error);
            return getMockRates(base, target);
        }
        const rates = {};
        // Cache and return rates
        Object.entries(data.rates).forEach(([currency, rate]) => {
            const decimalRate = new decimal_js_1.Decimal(rate);
            rates[currency] = decimalRate.toString();
            exchangeRateCache.set(`${base}-${currency}`, { rate: decimalRate, timestamp: Date.now() });
        });
        return rates;
    }
    catch (error) {
        console.error('Error fetching from Fixer API:', error);
        return getMockRates(base, target);
    }
}
/**
 * Fallback mock rates
 */
function getMockRates(base, target) {
    const rates = {};
    if (target) {
        const rate = getMockExchangeRate(base, target);
        rates[target] = rate.toString();
        exchangeRateCache.set(`${base}-${target}`, { rate, timestamp: Date.now() });
    }
    else {
        SUPPORTED_CURRENCIES.forEach(currency => {
            if (currency !== base) {
                const rate = getMockExchangeRate(base, currency);
                rates[currency] = rate.toString();
                exchangeRateCache.set(`${base}-${currency}`, { rate, timestamp: Date.now() });
            }
        });
    }
    return rates;
}
/**
 * Convert currency
 */
async function convertCurrency(params) {
    const { amount, from, to } = params;
    if (from === to) {
        return { convertedAmount: amount, rate: new decimal_js_1.Decimal(1) };
    }
    const rate = getMockExchangeRate(from, to);
    const convertedAmount = amount.mul(rate);
    return { convertedAmount, rate };
}
/**
 * Calculate conversion fees
 */
function calculateConversionFees(params) {
    const { amount, from, to, userTier } = params;
    // Base conversion fee (1% for standard users)
    let conversionFeePercent = new decimal_js_1.Decimal(1);
    // Apply tier-based discounts
    switch (userTier) {
        case 'PREMIUM':
            conversionFeePercent = new decimal_js_1.Decimal(0.5);
            break;
        case 'BUSINESS':
            conversionFeePercent = new decimal_js_1.Decimal(0.75);
            break;
        case 'VIP':
            conversionFeePercent = new decimal_js_1.Decimal(0.25);
            break;
    }
    // Calculate fees
    const conversionFee = amount.mul(conversionFeePercent).div(100);
    const markup = new decimal_js_1.Decimal(0); // Could add markup based on corridor
    const discount = userTier === 'VIP' ? conversionFee.mul(0.1) : new decimal_js_1.Decimal(0);
    const totalFee = conversionFee.plus(markup).minus(discount);
    const rate = getMockExchangeRate(from, to);
    const effectiveRate = rate.mul(new decimal_js_1.Decimal(1).minus(conversionFeePercent.div(100)));
    return {
        totalFee,
        conversionFee,
        markup,
        discount,
        effectiveRate,
    };
}
/**
 * Mock exchange rate (in production, fetch from external API)
 */
function getMockExchangeRate(from, to) {
    // Mock rates relative to USD
    const rates = {
        USD: new decimal_js_1.Decimal(1),
        EUR: new decimal_js_1.Decimal(0.92),
        GBP: new decimal_js_1.Decimal(0.79),
        NGN: new decimal_js_1.Decimal(1580),
        GHS: new decimal_js_1.Decimal(15.5),
        KES: new decimal_js_1.Decimal(150),
        ZAR: new decimal_js_1.Decimal(18.5),
        JPY: new decimal_js_1.Decimal(149),
        CAD: new decimal_js_1.Decimal(1.36),
        AUD: new decimal_js_1.Decimal(1.52),
        CHF: new decimal_js_1.Decimal(0.88),
        CNY: new decimal_js_1.Decimal(7.24),
        INR: new decimal_js_1.Decimal(83.2),
    };
    if (from === to)
        return new decimal_js_1.Decimal(1);
    const fromRate = rates[from] || new decimal_js_1.Decimal(1);
    const toRate = rates[to] || new decimal_js_1.Decimal(1);
    // Convert via USD
    return toRate.div(fromRate);
}
/**
 * Get currency name
 */
function getCurrencyName(code) {
    const names = {
        USD: 'US Dollar',
        EUR: 'Euro',
        GBP: 'British Pound',
        NGN: 'Nigerian Naira',
        GHS: 'Ghanaian Cedi',
        KES: 'Kenyan Shilling',
        ZAR: 'South African Rand',
        JPY: 'Japanese Yen',
        CAD: 'Canadian Dollar',
        AUD: 'Australian Dollar',
        CHF: 'Swiss Franc',
        CNY: 'Chinese Yuan',
        INR: 'Indian Rupee',
    };
    return names[code] || code;
}
/**
 * Get currency symbol
 */
function getCurrencySymbol(code) {
    const symbols = {
        USD: '$',
        EUR: '€',
        GBP: '£',
        NGN: '₦',
        GHS: '₵',
        KES: 'KSh',
        ZAR: 'R',
        JPY: '¥',
        CAD: 'C$',
        AUD: 'A$',
        CHF: 'CHF',
        CNY: '¥',
        INR: '₹',
    };
    return symbols[code] || code;
}
exports.default = router;
