import Decimal from 'decimal.js';
import * as oxr from './openexchange-service';

/**
 * CurrencyService
 * Centralized service for exchange rates, currency conversion, and fee calculation.
 */
export class CurrencyService {
    private static instance: CurrencyService;
    private cache = new Map<string, { rate: Decimal; timestamp: number }>();
    private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

    private constructor() { }

    public static getInstance(): CurrencyService {
        if (!this.instance) {
            this.instance = new CurrencyService();
        }
        return this.instance;
    }

    /**
     * Get the current exchange rate between two currencies.
     */
    async getExchangeRate(from: string, to: string): Promise<Decimal> {
        if (from === to) return new Decimal(1);

        const cacheKey = `${from}-${to}`;
        const cached = this.cache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.rate;
        }

        try {
            const conversion = await oxr.convertCurrency(from, to, 1);
            const rate = conversion.rate;

            this.cache.set(cacheKey, { rate, timestamp: Date.now() });
            // Also cache the inverse
            this.cache.set(`${to}-${from}`, { rate: new Decimal(1).div(rate), timestamp: Date.now() });

            return rate;
        } catch (error) {
            console.error(`[CurrencyService] Error fetching rate for ${from} to ${to}:`, error);
            // Fallback to mock rates if OXR fails (important for resilience)
            return this.getMockRate(from, to);
        }
    }

    /**
     * Convert an amount from one currency to another.
     */
    async convert(amount: number | Decimal, from: string, to: string): Promise<{
        amount: Decimal;
        rate: Decimal;
        targetAmount: Decimal;
    }> {
        const amountDecimal = amount instanceof Decimal ? amount : new Decimal(amount);
        const rate = await this.getExchangeRate(from, to);
        const targetAmount = amountDecimal.mul(rate);

        return {
            amount: amountDecimal,
            rate,
            targetAmount
        };
    }

    /**
     * Calculate fees based on amount, currency, and user tier.
     */
    calculateFees(amount: number | Decimal, userTier: string = 'STANDARD'): {
        totalFee: Decimal;
        percentageFee: Decimal;
        fixedFee: Decimal;
    } {
        const amountDecimal = amount instanceof Decimal ? amount : new Decimal(amount);

        // Fee structure base
        let feePercentage = new Decimal(0.01); // 1% default
        let fixedFee = new Decimal(0);

        // Adjust based on tier
        switch (userTier.toUpperCase()) {
            case 'PREMIUM':
                feePercentage = new Decimal(0.005); // 0.5%
                break;
            case 'GOLD':
                feePercentage = new Decimal(0.0075); // 0.75%
                break;
            case 'SILVER':
                feePercentage = new Decimal(0.009); // 0.9%
                break;
            case 'VERIFIED':
                feePercentage = new Decimal(0.01); // 1%
                break;
            default:
                feePercentage = new Decimal(0.015); // 1.5% for unverified/standard
        }

        const percentageFee = amountDecimal.mul(feePercentage);
        const totalFee = percentageFee.plus(fixedFee);

        return {
            totalFee,
            percentageFee,
            fixedFee
        };
    }

    /**
     * Resilient mock rates in case API is down or unavailable.
     */
    private getMockRate(from: string, to: string): Decimal {
        const rates: Record<string, number> = {
            USD: 1,
            EUR: 0.92,
            GBP: 0.79,
            NGN: 1580,
            GHS: 15.5,
            KES: 150,
            ZAR: 18.5,
        };

        const fromRate = rates[from] || 1;
        const toRate = rates[to] || 1;

        return new Decimal(toRate).div(fromRate);
    }
}

export const currencyService = CurrencyService.getInstance();
