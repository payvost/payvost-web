import { Router, Request, Response } from 'express';
import { verifyFirebaseToken, optionalAuth, AuthenticatedRequest } from '../../gateway/middleware';
import { ValidationError } from '../../gateway/index';
import Decimal from 'decimal.js';
import { currencyService } from './currencyService';

const router = Router();

/**
 * GET /api/currency/rates
 * Get current exchange rates
 */
router.get('/rates', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { base = 'USD', target } = req.query;

    const rate = await currencyService.getExchangeRate(base as string, target as string || 'USD');

    res.status(200).json({
      base,
      timestamp: new Date().toISOString(),
      rates: { [target as string || 'USD']: rate.toString() },
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

    const result = await currencyService.convert(amount, from, to);

    res.status(200).json({
      amount: amount,
      from,
      to,
      convertedAmount: result.targetAmount.toString(),
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
 */
const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR'];

router.get('/supported', (req: Request, res: Response) => {
  res.status(200).json({
    currencies: SUPPORTED_CURRENCIES.map(code => ({
      code,
      name: code, // Simplification for now
      symbol: code,
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

    const fees = currencyService.calculateFees(amount, userTier);

    res.status(200).json({
      amount: amount,
      from,
      to,
      fees: fees.totalFee.toString(),
      breakdown: {
        percentageFee: fees.percentageFee.toString(),
        fixedFee: fees.fixedFee.toString(),
      },
    });
  } catch (error: any) {
    console.error('Error calculating fees:', error);
    res.status(500).json({ error: error.message || 'Failed to calculate fees' });
  }
});

export default router;
