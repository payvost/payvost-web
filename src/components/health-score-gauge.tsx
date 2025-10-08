
'use client';

import * as React from 'react';
import { Pie, PieChart, Cell } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';

interface HealthScoreGaugeProps {
  score: number;
}

const getScoreColor = (score: number) => {
    if (score >= 80) return 'hsl(var(--chart-2))'; // Green
    if (score >= 50) return 'hsl(var(--chart-4))'; // Yellow/Orange
    return 'hsl(var(--chart-5))'; // Red
}

export function HealthScoreGauge({ score }: HealthScoreGaugeProps) {
  const data = [
    { name: 'Score', value: score, color: getScoreColor(score) },
    { name: 'Remaining', value: 100 - score, color: 'hsl(var(--muted))' },
  ];
  
  const activeSegment = 0;

  return (
    <ChartContainer
      config={{}}
      className="mx-auto aspect-square h-full max-h-[300px] relative"
    >
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          startAngle={180}
          endAngle={0}
          innerRadius="70%"
          outerRadius="100%"
          cornerRadius={10}
          cy="80%"
          paddingAngle={2}
          blendStroke
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
      </PieChart>
       <div className="absolute inset-x-0 top-[60%] -translate-y-1/2 flex flex-col items-center justify-center text-center">
        <p className="text-5xl font-bold" style={{ color: getScoreColor(score) }}>{score}</p>
        <p className="text-sm text-muted-foreground">out of 100</p>
      </div>
    </ChartContainer>
  );
}
