'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import {
  TrendingUp,
  TrendingDown,
  LineChart,
  BarChart3,
  Activity,
  ArrowUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DetailedChartProps {
  currencyCode: string;
  currencyName: string;
  currentRate: number;
  change24h: number;
  symbol: string;
  flag: string;
  baseCurrency: string;
}

export function DetailedRateChart({
  currencyCode,
  currencyName,
  currentRate,
  change24h,
  symbol,
  flag,
  baseCurrency,
}: DetailedChartProps) {
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | '1y'>('24h');
  const [chartData, setChartData] = useState<{ time: string; rate: number }[]>([]);

  useEffect(() => {
    // Generate mock data based on timeframe
    const generateData = () => {
      const periods = {
        '24h': 24,
        '7d': 7 * 24,
        '30d': 30,
        '1y': 12,
      };

      const period = periods[timeframe];
      const data: { time: string; rate: number }[] = [];
      const now = Date.now();

      for (let i = period - 1; i >= 0; i--) {
        let time: string;
        let interval: number;

        if (timeframe === '24h') {
          interval = i * 60 * 60 * 1000;
          time = new Date(now - interval).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          });
        } else if (timeframe === '7d') {
          interval = i * 60 * 60 * 1000;
          time = new Date(now - interval).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
          });
        } else if (timeframe === '30d') {
          interval = i * 24 * 60 * 60 * 1000;
          time = new Date(now - interval).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });
        } else {
          interval = i * 30 * 24 * 60 * 60 * 1000;
          time = new Date(now - interval).toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
          });
        }

        const trend = change24h / period;
        const noise = (Math.random() - 0.5) * 1;
        const rate = currentRate * (1 - change24h / 100) * (1 + ((trend + noise) * i) / 100);

        data.push({ time, rate });
      }

      return data;
    };

    setChartData(generateData());
  }, [timeframe, currentRate, change24h]);

  if (chartData.length === 0) return null;

  const minRate = Math.min(...chartData.map(d => d.rate));
  const maxRate = Math.max(...chartData.map(d => d.rate));
  const range = maxRate - minRate;

  const width = 100;
  const height = 60;
  const padding = 5;

  const points = chartData.map((point, index) => {
    const x = padding + ((index / (chartData.length - 1)) * (width - 2 * padding));
    const y = height - padding - (((point.rate - minRate) / range) * (height - 2 * padding));
    return { x, y, rate: point.rate, time: point.time };
  });

  const pathData = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
  const isPositive = change24h >= 0;

  const [hoveredPoint, setHoveredPoint] = useState<typeof points[0] | null>(null);

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image 
              src={flag} 
              alt={currencyCode}
              width={32}
              height={32}
              className="rounded"
            />
            <div>
              <CardTitle className="text-xl">
                {currencyCode} / {baseCurrency}
              </CardTitle>
              <CardDescription>{currencyName} Exchange Rate</CardDescription>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {symbol}
              {currentRate.toFixed(4)}
            </div>
            <Badge
              variant={isPositive ? 'default' : 'destructive'}
              className={cn(
                'flex items-center gap-1 w-fit ml-auto',
                isPositive && 'bg-green-500 hover:bg-green-600'
              )}
            >
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(change24h).toFixed(2)}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as typeof timeframe)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="24h">24H</TabsTrigger>
            <TabsTrigger value="7d">7D</TabsTrigger>
            <TabsTrigger value="30d">30D</TabsTrigger>
            <TabsTrigger value="1y">1Y</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative bg-muted/30 rounded-lg p-4">
          {hoveredPoint && (
            <div className="absolute top-2 left-2 bg-background border rounded-lg p-2 text-xs shadow-lg z-10">
              <div className="font-semibold">
                {symbol}
                {hoveredPoint.rate.toFixed(4)}
              </div>
              <div className="text-muted-foreground">{hoveredPoint.time}</div>
            </div>
          )}

          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-64"
            preserveAspectRatio="none"
            onMouseLeave={() => setHoveredPoint(null)}
          >
            <defs>
              <linearGradient id={`detailed-gradient-${currencyCode}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop
                  offset="0%"
                  stopColor={isPositive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'}
                  stopOpacity="0.2"
                />
                <stop
                  offset="100%"
                  stopColor={isPositive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'}
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((percent) => (
              <line
                key={percent}
                x1={padding}
                y1={padding + (percent / 100) * (height - 2 * padding)}
                x2={width - padding}
                y2={padding + (percent / 100) * (height - 2 * padding)}
                stroke="currentColor"
                strokeOpacity="0.1"
                strokeWidth="0.5"
              />
            ))}

            {/* Fill area */}
            <path
              d={`${pathData} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`}
              fill={`url(#detailed-gradient-${currencyCode})`}
            />

            {/* Line */}
            <path
              d={pathData}
              fill="none"
              stroke={isPositive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />

            {/* Interactive points */}
            {points.map((point, index) => (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r="1.5"
                fill={isPositive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'}
                className="cursor-pointer hover:r-3 transition-all"
                onMouseEnter={() => setHoveredPoint(point)}
              />
            ))}
          </svg>

          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>{chartData[0]?.time}</span>
            <span>{chartData[chartData.length - 1]?.time}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div>
            <div className="text-xs text-muted-foreground">24h High</div>
            <div className="font-semibold">
              {symbol}
              {maxRate.toFixed(4)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">24h Low</div>
            <div className="font-semibold">
              {symbol}
              {minRate.toFixed(4)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Average</div>
            <div className="font-semibold">
              {symbol}
              {((maxRate + minRate) / 2).toFixed(4)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Volatility</div>
            <div className="font-semibold">{((range / minRate) * 100).toFixed(2)}%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ComparisonChartProps {
  baseCurrency: string;
  currencies: Array<{
    code: string;
    name: string;
    rate: number;
    change24h: number;
    symbol: string;
    flag: string;
  }>;
}

export function CurrencyComparisonChart({ baseCurrency, currencies }: ComparisonChartProps) {
  const maxRate = Math.max(...currencies.map(c => c.rate));

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <CardTitle>Currency Comparison</CardTitle>
        </div>
        <CardDescription>Relative strength vs {baseCurrency}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {currencies.map((currency) => {
          const percentage = (currency.rate / maxRate) * 100;
          const isPositive = currency.change24h >= 0;

          return (
            <div key={currency.code} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Image 
                    src={currency.flag} 
                    alt={currency.code}
                    width={24}
                    height={24}
                    className="rounded"
                  />
                  <span className="font-medium">{currency.code}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {currency.symbol}
                    {currency.rate.toFixed(4)}
                  </span>
                  <Badge
                    variant={isPositive ? 'default' : 'destructive'}
                    className={cn('text-xs', isPositive && 'bg-green-500')}
                  >
                    {isPositive ? '+' : ''}
                    {currency.change24h.toFixed(2)}%
                  </Badge>
                </div>
              </div>
              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'absolute top-0 left-0 h-full rounded-full transition-all duration-500',
                    isPositive ? 'bg-green-500' : 'bg-red-500'
                  )}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
