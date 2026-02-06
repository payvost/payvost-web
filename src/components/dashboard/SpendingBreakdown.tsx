
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { SpendingItem } from '@/hooks/use-dashboard-data';

interface SpendingBreakdownProps {
    spendingData: SpendingItem[];
    hasTransactionData: boolean;
}

export function SpendingBreakdown({ spendingData, hasTransactionData }: SpendingBreakdownProps) {
    const total = spendingData.reduce((sum, item) => sum + item.amount, 0);

    return (
        <Card className="border-muted-foreground/15 shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Spending breakdown</CardTitle>
                <CardDescription className="text-xs">Live view of where your money went this month.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {!hasTransactionData ? (
                    <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/40 py-6 text-center text-muted-foreground">
                        No spending data for this month yet.
                    </div>
                ) : spendingData.map((item) => {
                    const percent = item.total > 0 ? (item.amount / item.total) * 100 : 0;
                    return (
                        <div key={item.category} className="space-y-2 rounded-xl border border-muted-foreground/10 bg-muted/30 p-3">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        {item.icon}
                                    </span>
                                    <div>
                                        <p className="text-sm font-semibold">{item.category}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {percent.toFixed(0)}% of your monthly spend
                                        </p>
                                    </div>
                                </div>
                                <p className="text-sm font-mono font-medium">
                                    ${item.amount.toFixed(2)}
                                </p>
                            </div>
                            <Progress value={percent} className="h-2" />
                        </div>
                    );
                })}
                {hasTransactionData && (
                    <div className="flex items-center justify-between rounded-lg bg-primary/5 px-3 py-2 text-xs text-primary">
                        <span>Total for the month</span>
                        <span className="font-semibold">${total.toFixed(2)}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
