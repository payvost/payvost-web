'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { currencyService } from '@/services';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ExchangeRatePreviewProps {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  userTier?: string;
}

interface RatePreview {
  rate: number;
  convertedAmount: number;
  fee: number;
  totalSourceAmount: number;
  effectiveRate: number;
  timestamp: string;
}

export function ExchangeRatePreview({
  amount,
  fromCurrency,
  toCurrency,
  userTier = 'STANDARD',
}: ExchangeRatePreviewProps) {
  const [preview, setPreview] = useState<RatePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!amount || amount <= 0 || fromCurrency === toCurrency) {
      setPreview(null);
      return;
    }

    const fetchPreview = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get exchange rate
        const rate = await currencyService.getRate(fromCurrency, toCurrency);
        
        // Calculate conversion
        const convertedAmount = amount * rate;
        
        // Get fee calculation
        const feeResponse = await fetch('/api/currency/calculate-fees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: convertedAmount,
            from: fromCurrency,
            to: toCurrency,
            userTier,
          }),
        });

        if (!feeResponse.ok) {
          throw new Error('Failed to calculate fees');
        }

        const feeData = await feeResponse.json();
        const fee = parseFloat(feeData.fees || '0');
        const effectiveRate = parseFloat(feeData.effectiveRate || rate.toString());

        // Calculate source amount needed (reverse conversion with fee)
        const sourceAmountNeeded = convertedAmount / rate + fee;

        setPreview({
          rate,
          convertedAmount,
          fee,
          totalSourceAmount: sourceAmountNeeded,
          effectiveRate,
          timestamp: new Date().toISOString(),
        });
      } catch (err: any) {
        console.error('Error fetching rate preview:', err);
        setError(err.message || 'Failed to load exchange rate');
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchPreview, 500);
    return () => clearTimeout(debounceTimer);
  }, [amount, fromCurrency, toCurrency, userTier]);

  if (fromCurrency === toCurrency) {
    return null;
  }

  if (loading) {
    return (
      <Card className="mt-4">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading exchange rate...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mt-4">
        <Info className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!preview) {
    return null;
  }

  const rateChange = preview.rate > 1 ? 'up' : 'down';

  return (
    <Card className="mt-4 border-primary/20">
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Exchange Rate</span>
            <div className="flex items-center gap-1">
              {rateChange === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm font-semibold">
                1 {fromCurrency} = {preview.rate.toFixed(4)} {toCurrency}
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">You'll pay:</span>
              <span className="font-semibold">
                {preview.totalSourceAmount.toFixed(2)} {fromCurrency}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Conversion fee:</span>
              <span className="font-semibold text-orange-600">
                {preview.fee.toFixed(2)} {fromCurrency}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">They'll receive:</span>
              <span className="font-semibold text-green-600">
                {preview.convertedAmount.toFixed(2)} {toCurrency}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Effective rate: {preview.effectiveRate.toFixed(4)} (includes fees)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

