
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { SpendingItem } from '@/hooks/use-dashboard-data';

interface SpendingBreakdownProps {
    spendingData: SpendingItem[];
    hasTransactionData: boolean;
}

export function SpendingBreakdown({ spendingData, hasTransactionData }: SpendingBreakdownProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Spending Breakdown</CardTitle>
                <CardDescription>Overview of your spending this month.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {!hasTransactionData ? (
                    <div className="text-center py-10 text-muted-foreground">No spending data for this month yet.</div>
                ) : spendingData.map((item) => (
                    <div key={item.category} className="flex items-center gap-4">
                        <div className="p-3 bg-muted rounded-lg">{item.icon}</div>
                        <div className="flex-1 space-y-1">
                            <div className="flex justify-between">
                                <p className="text-sm font-medium">{item.category}</p>
                                <p className="text-sm font-mono">${item.amount.toFixed(2)}</p>
                            </div>
                            <Progress value={item.total > 0 ? (item.amount / item.total) * 100 : 0} className="h-2" />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
