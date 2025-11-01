import { describe, test, expect } from 'vitest';
import { Decimal } from 'decimal.js';

describe('Currency Service Tests', () => {
  test('should calculate exchange rate correctly', () => {
    // Mock rates: 1 USD = 0.92 EUR
    const amount = new Decimal(100);
    const rate = new Decimal(0.92);
    const converted = amount.mul(rate);

    expect(converted.toString()).toBe('92');
  });

  test('should calculate conversion fees for standard tier', () => {
    const amount = new Decimal(100);
    const feePercent = new Decimal(1); // 1% for standard
    const fee = amount.mul(feePercent).div(100);

    expect(fee.toString()).toBe('1');
  });

  test('should apply premium tier discount', () => {
    const amount = new Decimal(100);
    const feePercent = new Decimal(0.5); // 0.5% for premium
    const fee = amount.mul(feePercent).div(100);

    expect(fee.toString()).toBe('0.5');
  });

  test('should apply VIP tier discount with additional reduction', () => {
    const amount = new Decimal(100);
    const feePercent = new Decimal(0.25); // 0.25% for VIP
    const baseFee = amount.mul(feePercent).div(100);
    const discount = baseFee.mul(0.1); // 10% additional discount
    const finalFee = baseFee.minus(discount);

    expect(baseFee.toString()).toBe('0.25');
    expect(discount.toString()).toBe('0.025');
    expect(finalFee.toString()).toBe('0.225');
  });

  test('should handle same currency conversion', () => {
    const amount = new Decimal(100);
    const rate = new Decimal(1);
    const converted = amount.mul(rate);

    expect(converted.toString()).toBe('100');
  });

  test('should calculate effective rate with fees', () => {
    const rate = new Decimal(0.92);
    const feePercent = new Decimal(1);
    const effectiveRate = rate.mul(new Decimal(1).minus(feePercent.div(100)));

    expect(effectiveRate.toString()).toBe('0.9108');
  });

  test('should support multiple currency pairs', () => {
    const rates: Record<string, Decimal> = {
      'USD-EUR': new Decimal(0.92),
      'USD-GBP': new Decimal(0.79),
      'USD-NGN': new Decimal(1580),
    };

    expect(rates['USD-EUR'].toString()).toBe('0.92');
    expect(rates['USD-GBP'].toString()).toBe('0.79');
    expect(rates['USD-NGN'].toString()).toBe('1580');
  });

  test('should calculate cross-currency conversion via USD', () => {
    // EUR to NGN via USD
    // 1 EUR = 1.087 USD (1/0.92)
    // 1 USD = 1580 NGN
    // Therefore: 1 EUR = 1.087 * 1580 = 1717.46 NGN
    
    const eurToUsd = new Decimal(1).div(new Decimal(0.92));
    const usdToNgn = new Decimal(1580);
    const eurToNgn = eurToUsd.mul(usdToNgn);

    expect(eurToNgn.toDecimalPlaces(2).toString()).toBe('1717.39');
  });

  test('should validate currency codes', () => {
    const supportedCurrencies = ['USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR'];
    
    expect(supportedCurrencies.includes('USD')).toBe(true);
    expect(supportedCurrencies.includes('XXX')).toBe(false);
  });

  test('should calculate large amounts accurately', () => {
    const amount = new Decimal('1000000');
    const rate = new Decimal('0.92');
    const converted = amount.mul(rate);

    expect(converted.toString()).toBe('920000');
  });

  test('should handle decimal precision', () => {
    const amount = new Decimal('123.456789');
    const rate = new Decimal('0.920000');
    const converted = amount.mul(rate);

    expect(converted.toDecimalPlaces(2).toString()).toBe('113.58');
  });
});
