
'use client';

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';

const chartData = [
  { date: 'Aug 01', views: 25, tickets: 8 },
  { date: 'Aug 02', views: 30, tickets: 12 },
  { date: 'Aug 03', views: 28, tickets: 10 },
  { date: 'Aug 04', views: 45, tickets: 20 },
  { date: 'Aug 05', views: 40, tickets: 18 },
  { date: 'Aug 06', views: 55, tickets: 25 },
  { date: 'Aug 07', views: 50, tickets: 22 },
];

const chartConfig = {
  views: {
    label: 'Page Views',
    color: 'hsl(var(--chart-1))',
  },
  tickets: {
    label: 'Tickets Sold',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

export function EventAnalyticsChart() {
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
        <Line dataKey="tickets" type="monotone" stroke="var(--color-tickets)" strokeWidth={2} dot={false} />
      </LineChart>
    </ChartContainer>
  );
}
