import { Router, Request, Response } from 'express';
import { verifyFirebaseToken, optionalAuth, AuthenticatedRequest } from '../../gateway/middleware';
import { ValidationError } from '../../gateway/index';
import { Decimal } from 'decimal.js';

const router = Router();

// In-memory exchange rate cache (in production, use Redis or similar)
const exchangeRateCache = new Map<string, { rate: Decimal; timestamp: number }>();
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
router.get('/rates', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { base = 'USD', target } = req.query;

    if (!SUPPORTED_CURRENCIES.includes(base as string)) {
      throw new ValidationError(`Unsupported base currency: ${base}`);
    }

    if (target && !SUPPORTED_CURRENCIES.includes(target as string)) {
      throw new ValidationError(`Unsupported target currency: ${target}`);
    }

    const rates = await getExchangeRates(base as string, target as string | undefined);

    res.status(200).json({
      base,
      timestamp: new Date().toISOString(),
      rates,
    });
  } catch (error: any) {
    console.error('Error fetching exchange rates:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch exchange rates' });
  }
});

/**
 * POST /api/currency/convert
 * Convert amount from one currency to another
 */
router.post('/convert', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { amount, from, to } = req.body;

    if (!amount || !from || !to) {
      throw new ValidationError('amount, from, and to are required');
    }

    if (!SUPPORTED_CURRENCIES.includes(from)) {
      throw new ValidationError(`Unsupported source currency: ${from}`);
    }

    if (!SUPPORTED_CURRENCIES.includes(to)) {
      throw new ValidationError(`Unsupported target currency: ${to}`);
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
    console.error('Error converting currency:', error);
    res.status(500).json({ error: error.message || 'Failed to convert currency' });
  }
});

/**
 * GET /api/currency/supported
 * Get list of supported currencies
 */
router.get('/supported', (req: Request, res: Response) => {
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
router.post('/calculate-fees', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { amount, from, to, userTier = 'STANDARD' } = req.body;

    if (!amount || !from || !to) {
      throw new ValidationError('amount, from, and to are required');
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
    console.error('Error calculating fees:', error);
    res.status(500).json({ error: error.message || 'Failed to calculate fees' });
  }
});

/**
 * Get exchange rates (mock implementation - in production, fetch from external API)
 */
async function getExchangeRates(base: string, target?: string): Promise<Record<string, string>> {
  // Check cache first
  const cacheKey = `${base}-rates`;
  const cached = exchangeRateCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    const rates: Record<string, string> = {};
    if (target) {
      rates[target] = cached.rate.toString();
    } else {
      // Return all rates (mock - in production, fetch from API)
      SUPPORTED_CURRENCIES.forEach(currency => {
        if (currency !== base) {
          rates[currency] = getMockExchangeRate(base, currency).toString();
        }
      });
    }
    return rates;
  }

  // Mock exchange rates (in production, fetch from external API like Fixer.io, ExchangeRate-API, etc.)
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
      }
    });
    exchangeRateCache.set(cacheKey, { rate: new Decimal(1), timestamp: Date.now() });
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

  const rate = getMockExchangeRate(from, to);
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
 * Mock exchange rate (in production, fetch from external API)
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

export default router;
