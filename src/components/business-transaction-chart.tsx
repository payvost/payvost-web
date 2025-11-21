
'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';

const defaultChartData = [
  { day: 'Mon', inflow: 12000, outflow: 8000 },
  { day: 'Tue', inflow: 15000, outflow: 9000 },
  { day: 'Wed', inflow: 11000, outflow: 7500 },
  { day: 'Thu', inflow: 18000, outflow: 11000 },
  { day: 'Fri', inflow: 22000, outflow: 15000 },
  { day: 'Sat', inflow: 9000, outflow: 5000 },
  { day: 'Sun', inflow: 6000, outflow: 3000 },
];

const chartConfig = {
  inflow: {
    label: 'Inflow',
    color: 'hsl(var(--chart-2))',
  },
  outflow: {
    label: 'Outflow',
    color: 'hsl(var(--chart-5))',
  },
} satisfies ChartConfig;

interface BusinessTransactionChartProps {
  data?: Array<{
    day: string;
    inflow: number;
    outflow: number;
  }>;
  currency?: string;
}

export function BusinessTransactionChart({ data, currency = 'USD' }: BusinessTransactionChartProps) {
  const chartData = data && data.length > 0 ? data : defaultChartData;
  
  // Calculate max value for Y-axis formatting
  const maxValue = Math.max(
    ...chartData.flatMap(d => [d.inflow, d.outflow])
  );

  const formatYAxis = (value: number) => {
    if (maxValue >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (maxValue >= 1000) {
      return `$${(value / 1000).toFixed(0)}k`;
    }
    return `$${value}`;
  };

  if (!data && !defaultChartData) {
    return <Skeleton className="h-[250px] w-full" />;
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
      <BarChart data={chartData}>
        <XAxis
          dataKey="day"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <YAxis 
           tickLine={false}
           axisLine={false}
           tickMargin={10}
           tickFormatter={formatYAxis}
        />
        <Tooltip 
          cursor={false} 
          content={<ChartTooltipContent indicator="dot" />}
          formatter={(value: number) => {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: currency,
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(value);
          }}
        />
        <Legend />
        <Bar dataKey="inflow" fill="var(--color-inflow)" radius={4} />
        <Bar dataKey="outflow" fill="var(--color-outflow)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
