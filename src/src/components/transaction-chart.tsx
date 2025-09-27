
'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';

const chartData = [
  { month: 'January', income: 1860, expense: 800 },
  { month: 'February', income: 3050, expense: 2000 },
  { month: 'March', income: 2370, expense: 1200 },
  { month: 'April', income: 730, expense: 1900 },
  { month: 'May', income: 2090, expense: 1300 },
  { month: 'June', income: 2140, expense: 1100 },
];

const chartConfig = {
  income: {
    label: 'Income',
    color: 'hsl(var(--chart-2))',
  },
  expense: {
    label: 'Expense',
    color: 'hsl(var(--chart-5))',
  },
} satisfies ChartConfig;

export function TransactionChart() {
  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart
        data={chartData}
        margin={{
            top: 20,
            right: 20,
            bottom: 20,
            left: 20,
        }}
      >
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
        <Bar dataKey="income" fill="var(--color-income)" radius={4} />
        <Bar dataKey="expense" fill="var(--color-expense)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
