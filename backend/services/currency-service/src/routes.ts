import { Router, Request, Response } from 'express';
import { verifyFirebaseToken, optionalAuth, AuthenticatedRequest } from '../../../gateway/middleware';
import { ValidationError } from '../../../gateway/index';
import Decimal from 'decimal.js';
import { currencyService } from './currencyService';
import { rateSnapshotService } from './rateSnapshotService';

const router = Router();

/**
 * GET /api/currency/rates
 * Get current exchange rates
 */
router.get('/rates', optionalAuth, async (req: Request, res: Response) => {
    try {
        const { base = 'USD', target } = req.query;
        const baseCurrency = String(base || 'USD').toUpperCase();

        // If a target currency is specified, keep the single-rate response.
        if (target) {
            const targetCurrency = String(target).toUpperCase();
            const rate = await currencyService.getExchangeRate(baseCurrency, targetCurrency);

            return res.status(200).json({
                base: baseCurrency,
                timestamp: new Date().toISOString(),
                rates: { [targetCurrency]: rate.toNumber() },
            });
        }

        // Otherwise return a full rates map based on the latest accepted snapshot.
        const snapshot = await rateSnapshotService.getLatestAcceptedSnapshot();
        const snapshotRates = snapshot.ratesJson as Record<string, string>;
        const rates: Record<string, number> = {};

        // Snapshot base is expected to be USD (DEFAULT_BASE), but handle non-USD base safely.
        const baseRate = snapshotRates[baseCurrency] ? new Decimal(snapshotRates[baseCurrency]) : new Decimal(1);

        for (const [currency, rateStr] of Object.entries(snapshotRates)) {
            const r = new Decimal(rateStr);
            // Convert USD-based rates into baseCurrency-based rates.
            const normalized = baseCurrency === snapshot.baseCurrency
                ? r
                : r.div(baseRate);
            rates[currency] = normalized.toNumber();
        }

        // Ensure the base currency itself is present.
        rates[baseCurrency] = 1;

        return res.status(200).json({
            base: baseCurrency,
            timestamp: new Date(snapshot.fetchedAt).toISOString(),
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
 * GET /admin/fx/snapshots/latest
 * Get latest accepted FX snapshot
 */
router.get('/admin/fx/snapshots/latest', verifyFirebaseToken, async (req: Request, res: Response) => {
    try {
        const snapshot = await rateSnapshotService.getLatestAcceptedSnapshot();
        res.status(200).json({ snapshot });
    } catch (error: any) {
        console.error('Error fetching latest FX snapshot:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch latest snapshot' });
    }
});

/**
 * POST /admin/fx/snapshots/refresh
 * Force fetch + persist a new FX snapshot
 */
router.post('/admin/fx/snapshots/refresh', verifyFirebaseToken, async (req: Request, res: Response) => {
    try {
        const result = await rateSnapshotService.ingestLatestSnapshot();
        res.status(200).json({ result });
    } catch (error: any) {
        console.error('Error refreshing FX snapshot:', error);
        res.status(500).json({ error: error.message || 'Failed to refresh snapshot' });
    }
});

/**
 * POST /api/currency/calculate-fees
 * Calculate currency conversion fees
 */
router.post('/calculate-fees', verifyFirebaseToken, async (req: Request, res: Response) => {
    try {
        const authReq = req as any;
        const { amount, from, to, userTier = 'STANDARD' } = authReq.body;

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
