
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface PartnerTransactionsProps {
    stats: { total: number; completed: number; pending: number; failed: number; totalAmount: number };
}

export function PartnerTransactions({ stats }: PartnerTransactionsProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Partner Transactions</CardTitle>
                <CardDescription>Activity from Reloadly, Rapyd, and other partners.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {stats.total === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">No partner transactions yet.</div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Total Transactions</p>
                                <p className="text-2xl font-bold">{stats.total}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Total Amount</p>
                                <p className="text-2xl font-bold">${stats.totalAmount.toFixed(2)}</p>
                            </div>
                        </div>
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                                    <span className="text-sm">Completed</span>
                                </div>
                                <span className="text-sm font-medium">{stats.completed}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                                    <span className="text-sm">Pending</span>
                                </div>
                                <span className="text-sm font-medium">{stats.pending}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                                    <span className="text-sm">Failed</span>
                                </div>
                                <span className="text-sm font-medium">{stats.failed}</span>
                            </div>
                        </div>
                        <Button asChild variant="outline" className="w-full mt-4">
                            <Link href="/dashboard/transactions">
                                View All Transactions
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
