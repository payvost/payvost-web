
'use client';

import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { TrendingUp } from 'lucide-react';

const chartData = [
  { month: 'Jan', value: 10000 },
  { month: 'Feb', value: 10500 },
  { month: 'Mar', value: 11200 },
  { month: 'Apr', value: 11000 },
  { month: 'May', value: 11800 },
  { month: 'Jun', value: 12500 },
  { month: 'Jul', value: 13500 },
  { month: 'Aug', value: 16250 },
];

const chartConfig = {
  value: {
    label: 'Portfolio Value',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export function InvestmentPortfolioChart() {
  // In a real app, this would be determined by whether there's actual data to show.
  const hasData = false;

  return (
    <ChartContainer config={chartConfig} className="w-full h-full">
        {hasData ? (
            <AreaChart data={chartData}>
                <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                />
                <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `$${Number(value) / 1000}k`}
                />
                <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                <Area
                dataKey="value"
                type="natural"
                fill="url(#colorValue)"
                fillOpacity={0.4}
                stroke="var(--color-value)"
                stackId="a"
                />
            </AreaChart>
        ) : (
            <div className="h-full w-full flex flex-col items-center justify-center text-center p-4">
                <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg">Start Investing to See Your Growth</h3>
                <p className="text-muted-foreground text-sm mt-1">Once you make your first investment, your portfolio's performance will be tracked here.</p>
            </div>
        )}
    </ChartContainer>
  );
}
