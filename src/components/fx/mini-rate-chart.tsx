'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RateHistory {
  time: string;
  rate: number;
}

interface MiniChartProps {
  currencyCode: string;
  currentRate: number;
  change24h: number;
}

export function MiniRateChart({ currencyCode, currentRate, change24h }: MiniChartProps) {
  const [history, setHistory] = useState<RateHistory[]>([]);

  useEffect(() => {
    // Generate mock historical data for the last 24 hours
    const now = Date.now();
    const mockHistory: RateHistory[] = [];
    
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now - i * 60 * 60 * 1000).toLocaleTimeString('en-US', { 
        hour: '2-digit',
        minute: '2-digit' 
      });
      
      // Generate rate with trend
      const trend = change24h / 24; // Distribute change over 24 hours
      const noise = (Math.random() - 0.5) * 0.5; // Add some randomness
      const rate = currentRate * (1 - (change24h / 100)) * (1 + ((trend + noise) * i) / 100);
      
      mockHistory.push({ time, rate });
    }
    
    setHistory(mockHistory);
  }, [currencyCode, currentRate, change24h]);

  if (history.length === 0) return null;

  const minRate = Math.min(...history.map(h => h.rate));
  const maxRate = Math.max(...history.map(h => h.rate));
  const range = maxRate - minRate;

  // Generate SVG path
  const width = 100;
  const height = 40;
  const points = history.map((point, index) => {
    const x = (index / (history.length - 1)) * width;
    const y = height - ((point.rate - minRate) / range) * height;
    return `${x},${y}`;
  });

  const pathData = `M ${points.join(' L ')}`;
  const isPositive = change24h >= 0;

  return (
    <div className="relative h-10 w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`gradient-${currencyCode}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop
              offset="0%"
              stopColor={isPositive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'}
              stopOpacity="0.3"
            />
            <stop
              offset="100%"
              stopColor={isPositive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'}
              stopOpacity="0"
            />
          </linearGradient>
        </defs>
        
        {/* Fill area */}
        <path
          d={`${pathData} L ${width},${height} L 0,${height} Z`}
          fill={`url(#gradient-${currencyCode})`}
        />
        
        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke={isPositive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

interface CurrencySparklineProps {
  currencyCode: string;
  currencyName: string;
  rate: number;
  change24h: number;
  symbol: string;
  flag: string;
}

export function CurrencySparkline({
  currencyCode,
  currencyName,
  rate,
  change24h,
  symbol,
  flag,
}: CurrencySparklineProps) {
  const isPositive = change24h >= 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{flag}</span>
            <div>
              <CardTitle className="text-sm font-medium">{currencyCode}</CardTitle>
              <p className="text-xs text-muted-foreground">{currencyName}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold">{symbol}{rate.toFixed(4)}</div>
            <div
              className={cn(
                'flex items-center gap-1 text-xs font-medium',
                isPositive ? 'text-green-600' : 'text-red-600'
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(change24h).toFixed(2)}%
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <MiniRateChart
          currencyCode={currencyCode}
          currentRate={rate}
          change24h={change24h}
        />
      </CardContent>
    </Card>
  );
}
