'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';

const chartData = [
  { month: 'January', volume: 186000, payouts: 80000 },
  { month: 'February', volume: 305000, payouts: 200000 },
  { month: 'March', volume: 237000, payouts: 120000 },
  { month: 'April', volume: 73000, payouts: 190000 },
  { month: 'May', volume: 209000, payouts: 130000 },
  { month: 'June', volume: 214000, payouts: 110000 },
];

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

export function AdminTransactionOverviewChart() {
  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
      <BarChart data={chartData}>
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
           tickFormatter={(value) => `$${Number(value) / 1000}k`}
        />
        <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
        <Legend />
        <Bar dataKey="volume" fill="var(--color-volume)" radius={4} />
        <Bar dataKey="payouts" fill="var(--color-payouts)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
