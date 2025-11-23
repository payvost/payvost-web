import express, { Request, Response } from 'express';
import Decimal from 'decimal.js';
import cors from 'cors';

const app = express();
const PORT = process.env.CURRENCY_SERVICE_PORT || 3010;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(cors());
app.use(express.json());

// In-memory exchange rate cache (persists on Render)
const exchangeRateCache = new Map<string, { rate: Decimal; timestamp: number }>();
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
async function getExchangeRates(base: string, target?: string): Promise<Record<string, string>> {
  // Check cache first
  const cacheKey = target ? `${base}-${target}` : `${base}-rates`;
  const cached = exchangeRateCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    const rates: Record<string, string> = {};
    if (target) {
      rates[target] = cached.rate.toString();
    } else {
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
    const data = await response.json() as { rates?: Record<string, number>; message?: string };

    if (!data.rates) {
      console.error('[Currency Service] OpenExchangeRates API error:', data.message || 'Unknown error');
      return getMockRates(base, target);
    }

    const rates: Record<string, string> = {};
    
    // Cache and return rates
    Object.entries(data.rates).forEach(([currency, rate]) => {
      const decimalRate = new Decimal(rate as number);
      rates[currency] = decimalRate.toString();
      exchangeRateCache.set(`${base}-${currency}`, { rate: decimalRate, timestamp: Date.now() });
    });

    return rates;
  } catch (error) {
    console.error('[Currency Service] Error fetching from OpenExchangeRates API:', error);
    return getMockRates(base, target);
  }
}

/**
 * Fallback mock rates
 */
function getMockRates(base: string, target?: string): Record<string, string> {
  const rates: Record<string, string> = {};
  
  if (target) {
    const rate = getMockExchangeRate(base, target);
    rates[target] = rate.toString();
    exchangeRateCache.set(`${base}-${target}`, { rate, timestamp: Date.now() });
  } else {
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
async function convertCurrency(params: {
  amount: Decimal;
  from: string;
  to: string;
}): Promise<{
  convertedAmount: Decimal;
  rate: Decimal;
}> {
  const { amount, from, to } = params;

  if (from === to) {
    return { convertedAmount: amount, rate: new Decimal(1) };
  }

  const rates = await getExchangeRates(from, to);
  const rateStr = rates[to];
  if (!rateStr) {
    throw new Error(`Rate not found for ${from} to ${to}`);
  }
  const rate = new Decimal(rateStr);
  const convertedAmount = amount.mul(rate);

  return { convertedAmount, rate };
}

/**
 * Calculate conversion fees
 */
function calculateConversionFees(params: {
  amount: Decimal;
  from: string;
  to: string;
  userTier: string;
}): {
  totalFee: Decimal;
  conversionFee: Decimal;
  markup: Decimal;
  discount: Decimal;
  effectiveRate: Decimal;
} {
  const { amount, from, to, userTier } = params;

  // Base conversion fee (1% for standard users)
  let conversionFeePercent = new Decimal(1);

  // Apply tier-based discounts
  switch (userTier) {
    case 'PREMIUM':
      conversionFeePercent = new Decimal(0.5);
      break;
    case 'BUSINESS':
      conversionFeePercent = new Decimal(0.75);
      break;
    case 'VIP':
      conversionFeePercent = new Decimal(0.25);
      break;
  }

  // Calculate fees
  const conversionFee = amount.mul(conversionFeePercent).div(100);
  const markup = new Decimal(0); // Could add markup based on corridor
  const discount = userTier === 'VIP' ? conversionFee.mul(0.1) : new Decimal(0);
  const totalFee = conversionFee.plus(markup).minus(discount);

  const rate = getMockExchangeRate(from, to);
  const effectiveRate = rate.mul(new Decimal(1).minus(conversionFeePercent.div(100)));

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
function getMockExchangeRate(from: string, to: string): Decimal {
  // Mock rates relative to USD
  const rates: Record<string, Decimal> = {
    USD: new Decimal(1),
    EUR: new Decimal(0.92),
    GBP: new Decimal(0.79),
    NGN: new Decimal(1580),
    GHS: new Decimal(15.5),
    KES: new Decimal(150),
    ZAR: new Decimal(18.5),
    JPY: new Decimal(149),
    CAD: new Decimal(1.36),
    AUD: new Decimal(1.52),
    CHF: new Decimal(0.88),
    CNY: new Decimal(7.24),
    INR: new Decimal(83.2),
  };

  if (from === to) return new Decimal(1);

  const fromRate = rates[from] || new Decimal(1);
  const toRate = rates[to] || new Decimal(1);

  // Convert via USD
  return toRate.div(fromRate);
}

/**
 * Get currency name
 */
function getCurrencyName(code: string): string {
  const names: Record<string, string> = {
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
function getCurrencySymbol(code: string): string {
  const symbols: Record<string, string> = {
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
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'healthy',
    service: 'currency-service',
    timestamp: new Date().toISOString(),
    cacheSize: exchangeRateCache.size,
    oxrConfigured: !!process.env.OPEN_EXCHANGE_RATES_APP_ID,
  });
});

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
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
app.get('/rates', async (req: Request, res: Response) => {
  try {
    const { base = 'USD', target } = req.query;

    if (!SUPPORTED_CURRENCIES.includes(base as string)) {
      return res.status(400).json({ error: `Unsupported base currency: ${base}` });
    }

    if (target && !SUPPORTED_CURRENCIES.includes(target as string)) {
      return res.status(400).json({ error: `Unsupported target currency: ${target}` });
    }

    const rates = await getExchangeRates(base as string, target as string | undefined);

    res.status(200).json({
      base,
      timestamp: new Date().toISOString(),
      rates,
    });
  } catch (error: any) {
    console.error('[Currency Service] Error fetching exchange rates:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch exchange rates' });
  }
});

/**
 * POST /convert
 * Convert amount from one currency to another
 */
app.post('/convert', async (req: Request, res: Response) => {
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
      amount: new Decimal(amount),
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
  } catch (error: any) {
    console.error('[Currency Service] Error converting currency:', error);
    res.status(500).json({ error: error.message || 'Failed to convert currency' });
  }
});

/**
 * GET /supported
 * Get list of supported currencies
 */
app.get('/supported', (_req: Request, res: Response) => {
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
app.post('/calculate-fees', async (req: Request, res: Response) => {
  try {
    const { amount, from, to, userTier = 'STANDARD' } = req.body;

    if (!amount || !from || !to) {
      return res.status(400).json({ error: 'amount, from, and to are required' });
    }

    const fees = calculateConversionFees({
      amount: new Decimal(amount),
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
  } catch (error: any) {
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

