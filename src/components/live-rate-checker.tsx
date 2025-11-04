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
import Image from 'next/image';

const POPULAR_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '/flag/US.png' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '/flag/EU.png' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '/flag/GB.png' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '/flag/NG.png' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', flag: '/flag/GH.png' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', flag: '/flag/KE.png' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '/flag/SA.png' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '/flag/JP.png' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '/flag/CA.png' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '/flag/AU.png' },
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch conversion rate');
      }

      if (data.success && data.rate && data.result !== undefined) {
        setRate(data.rate);
        setConvertedAmount(data.result);
        setLastUpdate(new Date(data.timestamp * 1000));
      } else {
        throw new Error(data.error || 'Invalid response from server');
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
    <Card className="w-full border-2 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-background pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">Check Live Rates</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Get real-time exchange rates instantly</p>
          </div>
          <Link href="/fx-rates">
            <Button variant="outline" size="sm" className="gap-2">
              View All Rates
              <ExternalLink className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-5">
        {/* Amount and From Currency Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium">You Send</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="text-xl h-14 font-semibold"
            />
          </div>

          {/* From Currency */}
          <div className="space-y-2">
            <Label htmlFor="from" className="text-sm font-medium">From</Label>
            <Select value={fromCurrency} onValueChange={setFromCurrency}>
              <SelectTrigger id="from" className="h-14 text-lg">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <Image 
                      src={getCurrencyInfo(fromCurrency)?.flag || '/flag/US.png'} 
                      alt={fromCurrency}
                      width={24}
                      height={24}
                      className="rounded"
                    />
                    <span className="font-semibold">{fromCurrency}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {POPULAR_CURRENCIES.map(currency => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <div className="flex items-center gap-3">
                      <Image 
                        src={currency.flag} 
                        alt={currency.code}
                        width={24}
                        height={24}
                        className="rounded"
                      />
                      <div className="flex flex-col">
                        <span className="font-semibold">{currency.code}</span>
                        <span className="text-xs text-muted-foreground">{currency.name}</span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center -my-2">
          <Button
            variant="outline"
            size="icon"
            onClick={swapCurrencies}
            className="rounded-full h-10 w-10 border-2 shadow-sm hover:shadow-md transition-all"
          >
            <ArrowRightLeft className="h-5 w-5" />
          </Button>
        </div>

        {/* To Currency Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Converted Amount Display */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Recipient Gets</Label>
            <div className="h-14 px-4 rounded-md border bg-muted/30 flex items-center">
              {convertedAmount !== null && !isLoading ? (
                <span className="text-xl font-semibold text-primary">
                  {getCurrencyInfo(toCurrency)?.symbol}{convertedAmount.toFixed(2)}
                </span>
              ) : (
                <span className="text-muted-foreground">---</span>
              )}
            </div>
          </div>

          {/* To Currency */}
          <div className="space-y-2">
            <Label htmlFor="to" className="text-sm font-medium">To</Label>
            <Select value={toCurrency} onValueChange={setToCurrency}>
              <SelectTrigger id="to" className="h-14 text-lg">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <Image 
                      src={getCurrencyInfo(toCurrency)?.flag || '/flag/NG.png'} 
                      alt={toCurrency}
                      width={24}
                      height={24}
                      className="rounded"
                    />
                    <span className="font-semibold">{toCurrency}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {POPULAR_CURRENCIES.map(currency => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <div className="flex items-center gap-3">
                      <Image 
                        src={currency.flag} 
                        alt={currency.code}
                        width={24}
                        height={24}
                        className="rounded"
                      />
                      <div className="flex flex-col">
                        <span className="font-semibold">{currency.code}</span>
                        <span className="text-xs text-muted-foreground">{currency.name}</span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Exchange Rate Info */}
        {error ? (
          <div className="p-4 bg-destructive/5 border-2 border-destructive/20 rounded-xl text-center">
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
        ) : convertedAmount !== null && rate !== null ? (
          <div className="space-y-4">
            {/* Exchange Rate Display */}
            <div className="p-5 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 rounded-xl border-2 border-primary/10 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Exchange Rate
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    1 {fromCurrency} = {rate.toFixed(4)} {toCurrency}
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-background/50 rounded-lg border">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-semibold text-green-600">Live</span>
                </div>
              </div>
              {lastUpdate && (
                <div className="text-xs text-muted-foreground mt-3 pt-3 border-t border-primary/10">
                  Last updated: {lastUpdate.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        ) : isLoading ? (
          <div className="p-6 bg-muted/50 rounded-xl text-center border-2 border-muted">
            <RefreshCw className="h-8 w-8 mx-auto animate-spin text-primary mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Fetching live rate...</p>
          </div>
        ) : null}

        {/* Refresh Button */}
        <Button
          onClick={fetchRate}
          disabled={isLoading || !amount}
          className="w-full h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all"
          size="lg"
        >
          <RefreshCw className={cn('h-5 w-5 mr-2', isLoading && 'animate-spin')} />
          {isLoading ? 'Fetching Rate...' : 'Get Live Rate'}
        </Button>

        {/* Quick Info */}
        <div className="text-center space-y-2 pt-2">
          <p className="text-xs text-muted-foreground">
            Powered by Payvost Exchange Engine • Updates every 5 minutes
          </p>
          <Link 
            href="/fx-rates" 
            className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1 group"
          >
            View detailed rates and charts
            <TrendingUp className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
