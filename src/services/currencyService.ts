/**
 * Currency Service
 * 
 * Service for currency exchange rates and conversions.
 * Connects to the backend currency service API.
 */

import { apiClient, ApiError } from './apiClient';

/**
 * Exchange rate types
 */
export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: string;
}

export interface ConversionResult {
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
  fee?: number;
  timestamp: string;
}

/**
 * Currency Service class
 */
class CurrencyService {
  // Cache for exchange rates (5 minutes TTL)
  private rateCache: Map<string, { rate: number; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get exchange rate between two currencies
   */
  async getRate(from: string, to: string): Promise<number> {
    // Check cache first
    const cacheKey = `${from}-${to}`;
    const cached = this.rateCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.rate;
    }

    try {
      const response = await apiClient.get<{ rate: number }>(
        `/api/currency/rates?from=${from}&to=${to}`
      );
      
      // Update cache
      this.rateCache.set(cacheKey, {
        rate: response.rate,
        timestamp: Date.now(),
      });
      
      return response.rate;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(`Failed to fetch exchange rate: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get all exchange rates for a base currency
   */
  async getRates(baseCurrency: string): Promise<Record<string, number>> {
    try {
      const response = await apiClient.get<{ rates: Record<string, number> }>(
        `/api/currency/rates?base=${baseCurrency}`
      );
      
      // Update cache for all rates
      Object.entries(response.rates).forEach(([currency, rate]) => {
        const cacheKey = `${baseCurrency}-${currency}`;
        this.rateCache.set(cacheKey, {
          rate,
          timestamp: Date.now(),
        });
      });
      
      return response.rates;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(`Failed to fetch exchange rates: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Convert amount from one currency to another
   */
  async convert(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<ConversionResult> {
    try {
      const response = await apiClient.post<ConversionResult>(
        '/api/currency/convert',
        {
          amount,
          fromCurrency,
          toCurrency,
        }
      );
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(`Failed to convert currency: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Calculate converted amount locally using cached rate
   */
  async calculateConversion(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const rate = await this.getRate(fromCurrency, toCurrency);
    return amount * rate;
  }

  /**
   * Get supported currencies
   */
  async getSupportedCurrencies(): Promise<string[]> {
    try {
      const response = await apiClient.get<{ currencies: string[] }>(
        '/api/currency/supported'
      );
      return response.currencies;
    } catch (error) {
      // Return default currencies if API fails
      return ['USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'CAD', 'AUD', 'JPY'];
    }
  }

  /**
   * Clear rate cache
   */
  clearCache(): void {
    this.rateCache.clear();
  }

  /**
   * Calculate conversion fees
   */
  async calculateFees(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    userTier: string = 'STANDARD'
  ): Promise<{
    totalFee: number;
    conversionFee: number;
    markup: number;
    discount: number;
    effectiveRate: number;
  }> {
    try {
      const response = await apiClient.post<{
        fees: string;
        breakdown: {
          conversionFee: string;
          markup: string;
          discount: string;
        };
        effectiveRate: string;
      }>('/api/currency/calculate-fees', {
        amount,
        from: fromCurrency,
        to: toCurrency,
        userTier,
      });
      
      return {
        totalFee: parseFloat(response.fees),
        conversionFee: parseFloat(response.breakdown.conversionFee),
        markup: parseFloat(response.breakdown.markup),
        discount: parseFloat(response.breakdown.discount),
        effectiveRate: parseFloat(response.effectiveRate),
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(`Failed to calculate fees: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get exchange rate preview with fees
   */
  async getRatePreview(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    userTier: string = 'STANDARD'
  ): Promise<{
    rate: number;
    convertedAmount: number;
    fee: number;
    totalSourceAmount: number;
    effectiveRate: number;
  }> {
    if (fromCurrency === toCurrency) {
      return {
        rate: 1,
        convertedAmount: amount,
        fee: 0,
        totalSourceAmount: amount,
        effectiveRate: 1,
      };
    }

    const rate = await this.getRate(fromCurrency, toCurrency);
    const convertedAmount = amount * rate;
    const fees = await this.calculateFees(convertedAmount, fromCurrency, toCurrency, userTier);
    
    // Calculate source amount needed (reverse conversion with fee)
    const sourceAmountNeeded = convertedAmount / rate + fees.totalFee;

    return {
      rate,
      convertedAmount,
      fee: fees.totalFee,
      totalSourceAmount: sourceAmountNeeded,
      effectiveRate: fees.effectiveRate,
    };
  }

  /**
   * Format amount with currency symbol
   */
  formatAmount(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
}

// Export singleton instance
export const currencyService = new CurrencyService();

// Export default
export default currencyService;
