
'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import React from 'react';

interface TransactionChartProps {
    data: {
        month: string;
        income: number;
        expense: number;
    }[];
}

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

export function TransactionChart({ data }: TransactionChartProps) {
  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart
        data={data}
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
        />
        <YAxis 
           tickLine={false}
           axisLine={false}
           tickMargin={10}
           tickFormatter={(value) => {
             const numValue = Number(value);
             if (numValue >= 1000) {
               return `$${(numValue / 1000).toFixed(numValue >= 10000 ? 0 : 1)}k`;
             }
             return `$${numValue.toFixed(2)}`;
           }}
        />
        <Tooltip 
          cursor={false} 
          content={<ChartTooltipContent indicator="dot" />}
          formatter={(value: any) => {
            const numValue = Number(value);
            return new Intl.NumberFormat('en-US', { 
              style: 'currency', 
              currency: 'USD',
              minimumFractionDigits: numValue < 1 ? 2 : 0,
              maximumFractionDigits: numValue < 1 ? 2 : 0
            }).format(numValue);
          }}
        />
        <Legend />
        <Bar dataKey="income" fill="var(--color-income)" radius={4} />
        <Bar dataKey="expense" fill="var(--color-expense)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
