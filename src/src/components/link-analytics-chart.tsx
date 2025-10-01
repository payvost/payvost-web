
'use client';

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';

const chartData = [
  { date: 'Aug 01', views: 10, payments: 5 },
  { date: 'Aug 02', views: 15, payments: 8 },
  { date: 'Aug 03', views: 12, payments: 7 },
  { date: 'Aug 04', views: 20, payments: 12 },
  { date: 'Aug 05', views: 18, payments: 10 },
  { date: 'Aug 06', views: 25, payments: 15 },
  { date: 'Aug 07', views: 22, payments: 13 },
];

const chartConfig = {
  views: {
    label: 'Views',
    color: 'hsl(var(--chart-1))',
  },
  payments: {
    label: 'Payments',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

export function LinkAnalyticsChart() {
  return (
    <ChartContainer config={chartConfig} className="w-full h-full">
      <LineChart data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <YAxis 
           tickLine={false}
           axisLine={false}
           tickMargin={10}
        />
        <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
        <Legend />
        <Line dataKey="views" type="monotone" stroke="var(--color-views)" strokeWidth={2} dot={false} />
        <Line dataKey="payments" type="monotone" stroke="var(--color-payments)" strokeWidth={2} dot={false} />
      </LineChart>
    </ChartContainer>
  );
}

