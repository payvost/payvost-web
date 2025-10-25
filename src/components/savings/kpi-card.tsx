
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import React from 'react';

interface KpiCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: React.ReactNode;
  change?: string;
  isPositive?: boolean;
}

export function KpiCard({ title, value, prefix = "", suffix="", icon, change, isPositive }: KpiCardProps) {
  const formattedValue = value.toLocaleString('en-US', { 
      minimumFractionDigits: suffix === "%" ? 1 : 2, 
      maximumFractionDigits: suffix === "%" ? 1 : 2 
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {prefix}{formattedValue}{suffix}
        </div>
        {change && (
             <p className={cn("text-xs", isPositive ? "text-green-500" : "text-muted-foreground")}>
                {change}
            </p>
        )}
      </CardContent>
    </Card>
  );
}
