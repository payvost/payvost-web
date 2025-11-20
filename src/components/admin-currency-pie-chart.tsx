
'use client';

import * as React from 'react';
import { Pie, PieChart, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

interface CurrencyData {
  name: string;
  value: number;
}

const chartColors = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
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

interface AdminCurrencyPieChartProps {
  data?: CurrencyData[];
}

export function AdminCurrencyPieChart({ data = [] }: AdminCurrencyPieChartProps) {
  const chartData = React.useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      fill: chartColors[index % chartColors.length],
    }));
  }, [data]);

  const totalValue = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.value, 0);
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No currency data available
      </div>
    );
  }

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

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
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius="50%"
            strokeWidth={5}
            // Add this to fix the active segment growing issue
            activeIndex={-1} 
          >
            {chartData.map((entry, index) => (
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
                                    <span>{formatValue((entry.payload as any)?.value || 0)}</span>
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
