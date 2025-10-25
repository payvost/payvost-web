
'use client';

import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import type { SavingsGoal } from '@/types/savings-goal';
import { Button } from '@/components/ui/button';
import { PiggyBank } from 'lucide-react';
import { PlusCircle } from 'lucide-react';

interface SavingsChartProps {
    goals: SavingsGoal[];
}

// Helper to generate mock data for the chart based on goals
const generateChartData = (goals: SavingsGoal[]) => {
  const data = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = month.toLocaleString('default', { month: 'short' });
    
    // Simulate savings growth
    let totalSavings = goals.reduce((acc, goal) => {
        // This is a very simple simulation. A real app would use historical transaction data.
        const monthsSinceStart = (month.getTime() - (goal.startDate?.toDate()?.getTime() || 0)) / (1000 * 60 * 60 * 24 * 30);
        const savedAmount = Math.min(goal.targetAmount, goal.debitAmount * Math.max(0, monthsSinceStart));
        return acc + savedAmount;
    }, 0);

    data.push({ month: monthName, saved: Math.max(0, totalSavings) });
  }
  return data;
};


const chartConfig = {
  saved: {
    label: 'Total Saved',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export function SavingsChart({ goals }: SavingsChartProps) {
  const chartData = generateChartData(goals);
  const hasData = goals && goals.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Savings Growth</CardTitle>
        <CardDescription>Your total savings progress over the last 6 months.</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
            <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
            <AreaChart data={chartData}>
                <defs>
                    <linearGradient id="colorSaved" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-saved)" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="var(--color-saved)" stopOpacity={0}/>
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
                dataKey="saved"
                type="natural"
                fill="url(#colorSaved)"
                fillOpacity={0.4}
                stroke="var(--color-saved)"
                />
            </AreaChart>
            </ChartContainer>
        ) : (
            <div className="min-h-[300px] w-full flex flex-col items-center justify-center text-center p-4">
                <PiggyBank className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg">Start your savings journey</h3>
                <p className="text-muted-foreground text-sm mt-1 mb-4">Create a goal to see your savings grow over time.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
