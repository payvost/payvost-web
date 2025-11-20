'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';

interface ChartData {
  month: string;
  volume: number;
  payouts: number;
}

const chartConfig = {
  volume: {
    label: 'Volume',
    color: 'hsl(var(--chart-1))',
  },
  payouts: {
    label: 'Payouts',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

const defaultData: ChartData[] = [
  { month: 'January', volume: 0, payouts: 0 },
  { month: 'February', volume: 0, payouts: 0 },
  { month: 'March', volume: 0, payouts: 0 },
  { month: 'April', volume: 0, payouts: 0 },
  { month: 'May', volume: 0, payouts: 0 },
  { month: 'June', volume: 0, payouts: 0 },
];

interface AdminTransactionOverviewChartProps {
  data?: ChartData[];
}

export function AdminTransactionOverviewChart({ data = defaultData }: AdminTransactionOverviewChartProps) {
  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
      <BarChart data={data.length > 0 ? data : defaultData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <YAxis 
           tickLine={false}
           axisLine={false}
           tickMargin={10}
           tickFormatter={(value) => {
             if (value >= 1000000) {
               return `$${(Number(value) / 1000000).toFixed(1)}M`;
             }
             return `$${Number(value) / 1000}k`;
           }}
        />
        <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
        <Legend />
        <Bar dataKey="volume" fill="var(--color-volume)" radius={4} />
        <Bar dataKey="payouts" fill="var(--color-payouts)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
