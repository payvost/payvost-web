"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const decimal_js_1 = __importDefault(require("decimal.js"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const PORT = process.env.CURRENCY_SERVICE_PORT || 3010;
const NODE_ENV = process.env.NODE_ENV || 'development';
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// In-memory exchange rate cache (persists on Render)
const exchangeRateCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
/**
 * Supported currencies
 */
const SUPPORTED_CURRENCIES = [
    'USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR',
];
/**
 * Get exchange rates from OpenExchangeRates API
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
    // Fetch from OpenExchangeRates API
    const OXR_APP_ID = process.env.OPEN_EXCHANGE_RATES_APP_ID;
    if (!OXR_APP_ID) {
        console.warn('[Currency Service] OPEN_EXCHANGE_RATES_APP_ID not configured, using mock rates');
        return getMockRates(base, target);
    }
    try {
        const symbols = target ? target : SUPPORTED_CURRENCIES.filter(c => c !== base).join(',');
        const oxrUrl = `https://openexchangerates.org/api/latest.json?app_id=${OXR_APP_ID}${base !== 'USD' ? `&base=${base}` : ''}&symbols=${symbols}`;
        const response = await fetch(oxrUrl);
        const data = await response.json();
        if (!data.rates) {
            console.error('[Currency Service] OpenExchangeRates API error:', data.message || 'Unknown error');
            return getMockRates(base, target);
        }
        const rates = {};
        // Cache and return rates
        Object.entries(data.rates).forEach(([currency, rate]) => {
            const decimalRate = new decimal_js_1.default(rate);
            rates[currency] = decimalRate.toString();
            exchangeRateCache.set(`${base}-${currency}`, { rate: decimalRate, timestamp: Date.now() });
        });
        return rates;
    }
    catch (error) {
        console.error('[Currency Service] Error fetching from OpenExchangeRates API:', error);
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
        return { convertedAmount: amount, rate: new decimal_js_1.default(1) };
    }
    const rates = await getExchangeRates(from, to);
    const rateStr = rates[to];
    if (!rateStr) {
        throw new Error(`Rate not found for ${from} to ${to}`);
    }
    const rate = new decimal_js_1.default(rateStr);
    const convertedAmount = amount.mul(rate);
    return { convertedAmount, rate };
}
/**
 * Calculate conversion fees
 */
function calculateConversionFees(params) {
    const { amount, from, to, userTier } = params;
    // Base conversion fee (1% for standard users)
    let conversionFeePercent = new decimal_js_1.default(1);
    // Apply tier-based discounts
    switch (userTier) {
        case 'PREMIUM':
            conversionFeePercent = new decimal_js_1.default(0.5);
            break;
        case 'BUSINESS':
            conversionFeePercent = new decimal_js_1.default(0.75);
            break;
        case 'VIP':
            conversionFeePercent = new decimal_js_1.default(0.25);
            break;
    }
    // Calculate fees
    const conversionFee = amount.mul(conversionFeePercent).div(100);
    const markup = new decimal_js_1.default(0); // Could add markup based on corridor
    const discount = userTier === 'VIP' ? conversionFee.mul(0.1) : new decimal_js_1.default(0);
    const totalFee = conversionFee.plus(markup).minus(discount);
    const rate = getMockExchangeRate(from, to);
    const effectiveRate = rate.mul(new decimal_js_1.default(1).minus(conversionFeePercent.div(100)));
    return {
        totalFee,
        conversionFee,
        markup,
        discount,
        effectiveRate,
    };
}
/**
 * Mock exchange rate (fallback)
 */
function getMockExchangeRate(from, to) {
    // Mock rates relative to USD
    const rates = {
        USD: new decimal_js_1.default(1),
        EUR: new decimal_js_1.default(0.92),
        GBP: new decimal_js_1.default(0.79),
        NGN: new decimal_js_1.default(1580),
        GHS: new decimal_js_1.default(15.5),
        KES: new decimal_js_1.default(150),
        ZAR: new decimal_js_1.default(18.5),
        JPY: new decimal_js_1.default(149),
        CAD: new decimal_js_1.default(1.36),
        AUD: new decimal_js_1.default(1.52),
        CHF: new decimal_js_1.default(0.88),
        CNY: new decimal_js_1.default(7.24),
        INR: new decimal_js_1.default(83.2),
    };
    if (from === to)
        return new decimal_js_1.default(1);
    const fromRate = rates[from] || new decimal_js_1.default(1);
    const toRate = rates[to] || new decimal_js_1.default(1);
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
// Health check endpoint
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'currency-service',
        timestamp: new Date().toISOString(),
        cacheSize: exchangeRateCache.size,
        oxrConfigured: !!process.env.OPEN_EXCHANGE_RATES_APP_ID,
    });
});
// Root endpoint
app.get('/', (_req, res) => {
    res.json({
        service: 'Payvost Currency Service',
        version: '1.0.0',
        endpoints: {
            health: 'GET /health',
            rates: 'GET /rates',
            convert: 'POST /convert',
            supported: 'GET /supported',
            calculateFees: 'POST /calculate-fees',
        },
    });
});
/**
 * GET /rates
 * Get current exchange rates
 */
app.get('/rates', async (req, res) => {
    try {
        const { base = 'USD', target } = req.query;
        if (!SUPPORTED_CURRENCIES.includes(base)) {
            return res.status(400).json({ error: `Unsupported base currency: ${base}` });
        }
        if (target && !SUPPORTED_CURRENCIES.includes(target)) {
            return res.status(400).json({ error: `Unsupported target currency: ${target}` });
        }
        const rates = await getExchangeRates(base, target);
        res.status(200).json({
            base,
            timestamp: new Date().toISOString(),
            rates,
        });
    }
    catch (error) {
        console.error('[Currency Service] Error fetching exchange rates:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch exchange rates' });
    }
});
/**
 * POST /convert
 * Convert amount from one currency to another
 */
app.post('/convert', async (req, res) => {
    try {
        const { amount, from, to } = req.body;
        if (!amount || !from || !to) {
            return res.status(400).json({ error: 'amount, from, and to are required' });
        }
        if (!SUPPORTED_CURRENCIES.includes(from)) {
            return res.status(400).json({ error: `Unsupported source currency: ${from}` });
        }
        if (!SUPPORTED_CURRENCIES.includes(to)) {
            return res.status(400).json({ error: `Unsupported target currency: ${to}` });
        }
        const result = await convertCurrency({
            amount: new decimal_js_1.default(amount),
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
        console.error('[Currency Service] Error converting currency:', error);
        res.status(500).json({ error: error.message || 'Failed to convert currency' });
    }
});
/**
 * GET /supported
 * Get list of supported currencies
 */
app.get('/supported', (_req, res) => {
    res.status(200).json({
        currencies: SUPPORTED_CURRENCIES.map(code => ({
            code,
            name: getCurrencyName(code),
            symbol: getCurrencySymbol(code),
        })),
    });
});
/**
 * POST /calculate-fees
 * Calculate currency conversion fees
 */
app.post('/calculate-fees', async (req, res) => {
    try {
        const { amount, from, to, userTier = 'STANDARD' } = req.body;
        if (!amount || !from || !to) {
            return res.status(400).json({ error: 'amount, from, and to are required' });
        }
        const fees = calculateConversionFees({
            amount: new decimal_js_1.default(amount),
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
        console.error('[Currency Service] Error calculating fees:', error);
        res.status(500).json({ error: error.message || 'Failed to calculate fees' });
    }
});
// Graceful shutdown
const shutdown = async () => {
    console.log('[Currency Service] Shutting down gracefully...');
    process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
// Start server
app.listen(PORT, () => {
    console.log(`[Currency Service] Running on port ${PORT}`);
    console.log(`[Currency Service] Environment: ${NODE_ENV}`);
    console.log(`[Currency Service] OpenExchangeRates configured: ${!!process.env.OPEN_EXCHANGE_RATES_APP_ID}`);
    console.log(`[Currency Service] Endpoints:`);
    console.log(`  - GET http://localhost:${PORT}/health`);
    console.log(`  - GET http://localhost:${PORT}/rates`);
    console.log(`  - POST http://localhost:${PORT}/convert`);
    console.log(`  - GET http://localhost:${PORT}/supported`);
    console.log(`  - POST http://localhost:${PORT}/calculate-fees`);
});
