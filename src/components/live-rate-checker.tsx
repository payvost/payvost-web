'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRightLeft, TrendingUp, TrendingDown, RefreshCw, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const POPULAR_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', flag: '🇬🇭' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', flag: '🇰🇪' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
];

export function LiveRateChecker() {
  const [amount, setAmount] = useState('1000');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('NGN');
  const [rate, setRate] = useState<number | null>(null);
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRate = async () => {
    if (!amount || isNaN(parseFloat(amount))) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/exchange-rates/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: fromCurrency,
          to: toCurrency,
          amount: parseFloat(amount),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch conversion rate');
      }

      const data = await response.json();

      if (data.success) {
        setRate(data.rate);
        setConvertedAmount(data.result);
        setLastUpdate(new Date(data.timestamp * 1000));
      } else {
        throw new Error(data.error || 'Conversion failed');
      }
    } catch (err: any) {
      console.error('Error fetching rate:', err);
      setError(err.message || 'Failed to fetch rate');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on mount and when currencies change
  useEffect(() => {
    fetchRate();
  }, [fromCurrency, toCurrency]);

  // Fetch when amount changes with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (amount && !isNaN(parseFloat(amount))) {
        fetchRate();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [amount]);

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const getCurrencyInfo = (code: string) => {
    return POPULAR_CURRENCIES.find(c => c.code === code);
  };

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Check Live Rates</CardTitle>
          <Link href="/fx-rates">
            <Button variant="ghost" size="sm">
              View All Rates
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="space-y-4">
          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="text-lg h-12"
            />
          </div>

          {/* From Currency */}
          <div className="space-y-2">
            <Label htmlFor="from">From</Label>
            <Select value={fromCurrency} onValueChange={setFromCurrency}>
              <SelectTrigger id="from" className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POPULAR_CURRENCIES.map(currency => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{currency.flag}</span>
                      <span className="font-medium">{currency.code}</span>
                      <span className="text-muted-foreground">- {currency.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="icon"
              onClick={swapCurrencies}
              className="rounded-full"
            >
              <ArrowRightLeft className="h-5 w-5" />
            </Button>
          </div>

          {/* To Currency */}
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Select value={toCurrency} onValueChange={setToCurrency}>
              <SelectTrigger id="to" className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POPULAR_CURRENCIES.map(currency => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{currency.flag}</span>
                      <span className="font-medium">{currency.code}</span>
                      <span className="text-muted-foreground">- {currency.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Result */}
        {error ? (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-center">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : convertedAmount !== null && rate !== null ? (
          <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg border-2 border-primary/20">
            <div className="text-center space-y-3">
              <div className="text-sm text-muted-foreground">You'll receive</div>
              <div className="text-4xl font-bold text-primary">
                {getCurrencyInfo(toCurrency)?.symbol}
                {convertedAmount.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">
                {amount} {fromCurrency} = {convertedAmount.toFixed(2)} {toCurrency}
              </div>
              
              <div className="pt-3 border-t">
                <div className="flex items-center justify-center gap-2 text-sm">
                  <span className="text-muted-foreground">Exchange Rate:</span>
                  <span className="font-semibold">
                    1 {fromCurrency} = {rate.toFixed(4)} {toCurrency}
                  </span>
                </div>
                {lastUpdate && (
                  <div className="text-xs text-muted-foreground mt-2">
                    Updated: {lastUpdate.toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : isLoading ? (
          <div className="p-6 bg-muted rounded-lg text-center">
            <RefreshCw className="h-8 w-8 mx-auto animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Fetching live rate...</p>
          </div>
        ) : null}

        {/* Refresh Button */}
        <Button
          onClick={fetchRate}
          disabled={isLoading || !amount}
          className="w-full"
          size="lg"
        >
          <RefreshCw className={cn('h-5 w-5 mr-2', isLoading && 'animate-spin')} />
          {isLoading ? 'Fetching Rate...' : 'Refresh Rate'}
        </Button>

        {/* Quick Info */}
        <div className="text-center text-xs text-muted-foreground">
          <p>Powered by Fixer.io • Rates update every 5 minutes</p>
          <Link href="/fx-rates" className="text-primary hover:underline mt-1 inline-block">
            View detailed rates and charts →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
