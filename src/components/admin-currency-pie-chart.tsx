
'use client';

import * as React from 'react';
import { Pie, PieChart, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

const data = [
  { name: 'USD', value: 400, fill: 'hsl(var(--chart-1))' },
  { name: 'EUR', value: 300, fill: 'hsl(var(--chart-2))' },
  { name: 'GBP', value: 200, fill: 'hsl(var(--chart-3))' },
  { name: 'NGN', value: 278, fill: 'hsl(var(--chart-4))' },
  { name: 'OTHER', value: 189, fill: 'hsl(var(--chart-5))' },
];

const chartConfig = {
  value: {
    label: 'Value',
  },
  USD: {
    label: 'USD',
    color: 'hsl(var(--chart-1))',
  },
  EUR: {
    label: 'EUR',
    color: 'hsl(var(--chart-2))',
  },
  GBP: {
    label: 'GBP',
    color: 'hsl(var(--chart-3))',
  },
  NGN: {
    label: 'NGN',
    color: 'hsl(var(--chart-4))',
  },
  OTHER: {
    label: 'Other',
    color: 'hsl(var(--chart-5))',
  },
};

export function AdminCurrencyPieChart() {
  const totalValue = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.value, 0);
  }, []);

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square h-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel nameKey="name" />}
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="50%"
            strokeWidth={5}
            // Add this to fix the active segment growing issue
            activeIndex={-1} 
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
           <Legend 
                content={({ payload }) => {
                    return (
                        <ul className="flex flex-col space-y-1 mt-4">
                            {payload?.map((entry, index) => (
                                <li key={`item-${index}`} className="flex items-center space-x-2 text-sm">
                                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                    <span className="text-muted-foreground">{entry.value}</span>
                                    <span>${(entry.payload as any)?.value}K</span>
                                </li>
                            ))}
                        </ul>
                    )
                }}
                verticalAlign="bottom"
            />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
