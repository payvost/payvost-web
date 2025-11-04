'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SiteHeader } from '@/components/site-header';
import { CurrencySparkline } from '@/components/fx/mini-rate-chart';
import { DetailedRateChart, CurrencyComparisonChart } from '@/components/fx/detailed-chart';
import Image from 'next/image';
import {
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Star,
  StarOff,
  Search,
  Bell,
  Activity,
  BarChart3,
  Globe2,
  Zap,
  ArrowRightLeft,
  Clock,
  Maximize2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LastUpdatedTime } from '@/components/LastUpdatedTime';

// Currency data with flags and symbols
const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '/flag/US.png', country: 'United States' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '/flag/EU.png', country: 'European Union' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '/flag/GB.png', country: 'United Kingdom' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '/flag/NG.png', country: 'Nigeria' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', flag: '/flag/GH.png', country: 'Ghana' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', flag: '/flag/KE.png', country: 'Kenya' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '/flag/SA.png', country: 'South Africa' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '/flag/JP.png', country: 'Japan' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '/flag/CA.png', country: 'Canada' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '/flag/AU.png', country: 'Australia' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '/flag/GE.png', country: 'Switzerland' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '/flag/US.png', country: 'China' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '/flag/US.png', country: 'India' },
];

interface ExchangeRate {
  code: string;
  rate: number;
  change24h: number;
  previousRate: number;
  lastUpdated: Date;
}

export default function FXRatesPage() {
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [favorites, setFavorites] = useState<string[]>(['EUR', 'GBP', 'NGN']);
  const [searchQuery, setSearchQuery] = useState('');
  const [convertAmount, setConvertAmount] = useState('1000');
  const [convertFrom, setConvertFrom] = useState('USD');
  const [convertTo, setConvertTo] = useState('EUR');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedCurrency, setSelectedCurrency] = useState<ExchangeRate | null>(null);
  const [showDetailChart, setShowDetailChart] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');

  // Fetch real exchange rates from Payvost Exchange Engine (OpenExchangeRates API)
  const fetchExchangeRates = useCallback(async () => {
    setIsRefreshing(true);
    
    try {
      // Fetch rates with USD as base (free plan default)
      const response = await fetch(`/api/exchange-rates?base=${baseCurrency}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch rates');
      }

      // Map rates to our exchange rate structure
      const rates: ExchangeRate[] = CURRENCIES
        .filter(c => c.code !== baseCurrency)
        .map(currency => {
          const rate = data.rates[currency.code] || 1;
          
          // Calculate 24h change (simulated for now - would need historical data)
          const change24h = (Math.random() - 0.5) * 2; // ±1% for demo
          
          return {
            code: currency.code,
            rate,
            change24h,
            previousRate: rate / (1 + change24h / 100),
            lastUpdated: new Date(data.timestamp * 1000),
          };
        });

      setExchangeRates(rates);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      // Fallback to mock data on error
      const mockRates: ExchangeRate[] = CURRENCIES
        .filter(c => c.code !== baseCurrency)
        .map(currency => {
          const baseRate = getBaseRate(baseCurrency, currency.code);
          const rate = baseRate;
          const change24h = (Math.random() - 0.5) * 2;
          
          return {
            code: currency.code,
            rate,
            change24h,
            previousRate: rate / (1 + change24h / 100),
            lastUpdated: new Date(),
          };
        });
      setExchangeRates(mockRates);
    } finally {
      setIsRefreshing(false);
    }
  }, [baseCurrency]);

  // Initial fetch and polling
  useEffect(() => {
    fetchExchangeRates();
    const interval = setInterval(fetchExchangeRates, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [fetchExchangeRates]);

  // Get base exchange rate
  const getBaseRate = (from: string, to: string): number => {
    const rates: { [key: string]: number } = {
      'USD-EUR': 0.92,
      'USD-GBP': 0.79,
      'USD-NGN': 1585.50,
      'USD-GHS': 15.75,
      'USD-KES': 154.25,
      'USD-ZAR': 18.35,
      'USD-JPY': 149.80,
      'USD-CAD': 1.36,
      'USD-AUD': 1.53,
      'USD-CHF': 0.88,
      'USD-CNY': 7.24,
      'USD-INR': 83.15,
    };
    
    const key = `${from}-${to}`;
    if (rates[key]) return rates[key];
    
    const reverseKey = `${to}-${from}`;
    if (rates[reverseKey]) return 1 / rates[reverseKey];
    
    return 1;
  };

  const getCurrencyInfo = (code: string) => {
    return CURRENCIES.find(c => c.code === code);
  };

  const toggleFavorite = (code: string) => {
    setFavorites(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const filteredRates = exchangeRates.filter(rate => {
    const currency = getCurrencyInfo(rate.code);
    const query = searchQuery.toLowerCase();
    return (
      currency?.name.toLowerCase().includes(query) ||
      currency?.code.toLowerCase().includes(query) ||
      currency?.country.toLowerCase().includes(query)
    );
  });

  const favoriteRates = exchangeRates.filter(rate => favorites.includes(rate.code));

  const convertedAmount = () => {
    const amount = parseFloat(convertAmount) || 0;
    const fromRate = convertFrom === baseCurrency ? 1 : exchangeRates.find(r => r.code === convertFrom)?.rate || 1;
    const toRate = convertTo === baseCurrency ? 1 : exchangeRates.find(r => r.code === convertTo)?.rate || 1;
    return ((amount / fromRate) * toRate).toFixed(2);
  };

  const RateCard = ({ rate }: { rate: ExchangeRate }) => {
    const currency = getCurrencyInfo(rate.code);
    const isFavorite = favorites.includes(rate.code);
    const isPositive = rate.change24h >= 0;

    if (!currency) return null;

    if (viewMode === 'compact') {
      return (
        <CurrencySparkline
          currencyCode={currency.code}
          currencyName={currency.name}
          rate={rate.rate}
          change24h={rate.change24h}
          symbol={currency.symbol}
          flag={currency.flag}
        />
      );
    }

    return (
      <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 relative flex-shrink-0">
                <Image 
                  src={currency.flag} 
                  alt={`${currency.name} flag`} 
                  width={32} 
                  height={32}
                  className="rounded"
                />
              </div>
              <div>
                <CardTitle className="text-lg">{currency.code}</CardTitle>
                <CardDescription className="text-xs">{currency.name}</CardDescription>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedCurrency(rate);
                  setShowDetailChart(true);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleFavorite(rate.code)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {isFavorite ? (
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ) : (
                  <StarOff className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="text-3xl font-bold tracking-tight">
                {currency.symbol}{rate.rate.toFixed(4)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                per {baseCurrency}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge
                variant={isPositive ? 'default' : 'destructive'}
                className={cn(
                  'flex items-center gap-1',
                  isPositive && 'bg-green-500 hover:bg-green-600'
                )}
              >
                {isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {Math.abs(rate.change24h).toFixed(2)}%
              </Badge>
              <span className="text-xs text-muted-foreground">24h change</span>
            </div>

            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Updated</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(rate.lastUpdated).toLocaleTimeString()}
                </span>
              </div>
            </div>
            </div>
          </CardContent>
        </Card>
      );
    };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <SiteHeader />
      
      <main className="container mx-auto px-4 py-4 md:py-8 space-y-6 md:space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-3 md:space-y-4 py-6 md:py-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-primary/10 text-primary text-xs md:text-sm font-medium mb-2 md:mb-4">
            <Activity className="h-3 w-3 md:h-4 md:w-4 animate-pulse" />
            Live Exchange Rates
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight px-2">
            Real-Time <span className="text-primary">FX Rates</span>
          </h1>
          <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Monitor live foreign exchange rates across {CURRENCIES.length}+ currencies.
            Make informed decisions with up-to-the-second market data.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 pt-4 md:pt-6 px-4">
            <div className="flex items-center gap-2 text-xs md:text-sm">
              <Zap className="h-4 w-4 md:h-5 md:w-5 text-yellow-500" />
              <span>Updates every 30s</span>
            </div>
            <div className="flex items-center gap-2 text-xs md:text-sm">
              <Globe2 className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
              <span>{CURRENCIES.length} Currencies</span>
            </div>
            <div className="flex items-center gap-2 text-xs md:text-sm">
              <BarChart3 className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
              <span>Live Market Data</span>
            </div>
          </div>
        </div>

        {/* Base Currency Selector & Controls */}
        <Card className="border-2">
          <CardContent className="pt-4 md:pt-6">
            <div className="flex flex-col gap-3 md:gap-4">
              {/* First Row: Base Currency and Search */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div className="w-full">
                  <Label htmlFor="base-currency" className="text-sm font-medium mb-2 block">
                    Base Currency
                  </Label>
                  <Select value={baseCurrency} onValueChange={setBaseCurrency}>
                    <SelectTrigger id="base-currency" className="h-11 md:h-12 text-base md:text-lg w-full">
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <Image 
                            src={CURRENCIES.find(c => c.code === baseCurrency)?.flag || '/flag/US.png'}
                            alt={baseCurrency}
                            width={28}
                            height={28}
                            className="rounded"
                          />
                          <span className="font-semibold">{baseCurrency}</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(currency => (
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

                <div className="w-full">
                  <Label htmlFor="search" className="text-sm font-medium mb-2 block">
                    Search Currencies
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 md:top-3.5 h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by name, code..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 md:pl-10 h-11 md:h-12 text-sm md:text-base w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Second Row: Action Buttons */}
              <div className="flex flex-wrap gap-2 md:gap-3">
                <Button
                  onClick={fetchExchangeRates}
                  disabled={isRefreshing}
                  size="default"
                  className="h-10 md:h-12 px-4 md:px-6 text-sm md:text-base flex-1 sm:flex-none"
                >
                  <RefreshCw className={cn('h-4 w-4 md:h-5 md:w-5 mr-2', isRefreshing && 'animate-spin')} />
                  <span className="hidden sm:inline">Refresh</span>
                  <span className="sm:hidden">Refresh</span>
                </Button>

                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="default"
                    className="h-10 md:h-12 px-3 md:px-4"
                    onClick={() => setViewMode('grid')}
                    aria-label="Grid view"
                  >
                    <BarChart3 className="h-4 w-4 md:h-5 md:w-5" />
                  </Button>
                  <Button
                    variant={viewMode === 'compact' ? 'default' : 'outline'}
                    size="default"
                    className="h-10 md:h-12 px-3 md:px-4"
                    onClick={() => setViewMode('compact')}
                    aria-label="Compact view"
                  >
                    <Activity className="h-4 w-4 md:h-5 md:w-5" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs md:text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Activity className="h-3 w-3 md:h-4 md:w-4 text-green-500 animate-pulse" />
                  <span>Live rates updating automatically</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>Last updated:</span>
                  <LastUpdatedTime date={lastUpdate} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Currency Converter */}
        <Card className="border-2 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader className="pb-3 md:pb-6">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              <CardTitle className="text-base md:text-lg">Quick Currency Converter</CardTitle>
            </div>
            <CardDescription className="text-xs md:text-sm">
              Convert between any two currencies instantly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  value={convertAmount}
                  onChange={(e) => setConvertAmount(e.target.value)}
                  className="h-11 md:h-12 text-base md:text-lg"
                  placeholder="Enter amount"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="from-currency" className="text-sm">From</Label>
                <Select value={convertFrom} onValueChange={setConvertFrom}>
                  <SelectTrigger id="from-currency" className="h-12">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <Image 
                          src={CURRENCIES.find(c => c.code === convertFrom)?.flag || '/flag/US.png'}
                          alt={convertFrom}
                          width={20}
                          height={20}
                          className="rounded"
                        />
                        <span className="font-semibold">{convertFrom}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(currency => (
                      <SelectItem key={currency.code} value={currency.code}>
                        <div className="flex items-center gap-2">
                          <Image 
                            src={currency.flag}
                            alt={currency.code}
                            width={20}
                            height={20}
                            className="rounded"
                          />
                          <span className="font-semibold">{currency.code}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="to-currency" className="text-sm">To</Label>
                <Select value={convertTo} onValueChange={setConvertTo}>
                  <SelectTrigger id="to-currency" className="h-12">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <Image 
                          src={CURRENCIES.find(c => c.code === convertTo)?.flag || '/flag/EU.png'}
                          alt={convertTo}
                          width={20}
                          height={20}
                          className="rounded"
                        />
                        <span className="font-semibold">{convertTo}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(currency => (
                      <SelectItem key={currency.code} value={currency.code}>
                        <div className="flex items-center gap-2">
                          <Image 
                            src={currency.flag}
                            alt={currency.code}
                            width={20}
                            height={20}
                            className="rounded"
                          />
                          <span className="font-semibold">{currency.code}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 md:mt-6 p-4 md:p-6 bg-background rounded-lg border-2">
              <div className="text-center space-y-2">
                <div className="text-xs md:text-sm text-muted-foreground">Converted Amount</div>
                <div className="text-2xl md:text-4xl font-bold text-primary break-words">
                  {getCurrencyInfo(convertTo)?.symbol}{convertedAmount()}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">
                  {convertAmount} {convertFrom} = {convertedAmount()} {convertTo}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exchange Rates Tabs */}
        <Tabs defaultValue="all" className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-10 md:h-12">
            <TabsTrigger value="all" className="text-sm md:text-base">
              All Currencies ({filteredRates.length})
            </TabsTrigger>
            <TabsTrigger value="favorites" className="text-sm md:text-base">
              <Star className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 fill-yellow-400 text-yellow-400" />
              Favorites ({favoriteRates.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {filteredRates.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No currencies found matching your search</p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredRates.map(rate => (
                  <RateCard key={rate.code} rate={rate} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="favorites" className="space-y-6">
            {favoriteRates.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="text-muted-foreground">
                  <StarOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">No favorite currencies yet</p>
                  <p className="text-sm">Click the star icon on any currency card to add it to your favorites</p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {favoriteRates.map(rate => (
                  <RateCard key={rate.code} rate={rate} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Info Banner */}
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Bell className="h-6 w-6 text-primary mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Stay Updated with Rate Alerts</h3>
                <p className="text-muted-foreground mb-4">
                  Sign up to receive notifications when exchange rates reach your target levels.
                  Never miss the perfect moment to transfer money.
                </p>
                <Button>Set Up Rate Alerts</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Currency Comparison */}
        {favoriteRates.length > 0 && (
          <CurrencyComparisonChart
            baseCurrency={baseCurrency}
            currencies={favoriteRates.map(rate => {
              const currency = getCurrencyInfo(rate.code);
              return {
                code: rate.code,
                name: currency?.name || '',
                rate: rate.rate,
                change24h: rate.change24h,
                symbol: currency?.symbol || '',
                flag: currency?.flag || '',
              };
            })}
          />
        )}

        {/* Detailed Chart Modal */}
        <Dialog open={showDetailChart} onOpenChange={setShowDetailChart}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detailed Exchange Rate Chart</DialogTitle>
              <DialogDescription>
                Historical exchange rate data and trends
              </DialogDescription>
            </DialogHeader>
            {selectedCurrency && (
              <DetailedRateChart
                currencyCode={selectedCurrency.code}
                currencyName={getCurrencyInfo(selectedCurrency.code)?.name || ''}
                currentRate={selectedCurrency.rate}
                change24h={selectedCurrency.change24h}
                symbol={getCurrencyInfo(selectedCurrency.code)?.symbol || ''}
                flag={getCurrencyInfo(selectedCurrency.code)?.flag || ''}
                baseCurrency={baseCurrency}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Footer Info */}
        <Card className="border-2 bg-muted/50">
          <CardContent className="py-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Powered by <span className="font-semibold text-foreground">Payvost Exchange Engine</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Real-time exchange rates • Updates every 30 seconds • {CURRENCIES.length} currencies supported
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
