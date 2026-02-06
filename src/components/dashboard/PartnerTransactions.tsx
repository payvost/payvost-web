
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface PartnerTransactionsProps {
    stats: { total: number; completed: number; pending: number; failed: number; totalAmount: number };
}

export function PartnerTransactions({ stats }: PartnerTransactionsProps) {
    const successRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

    return (
        <Card className="border-muted-foreground/15 shadow-sm">
            <CardHeader>
                <CardTitle className="text-sm font-semibold">Partner rails</CardTitle>
                <CardDescription className="text-xs">Reloadly, Rapyd, and connected providers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {stats.total === 0 ? (
                    <div className="text-center rounded-lg border border-dashed border-muted-foreground/30 bg-muted/40 py-8 text-muted-foreground">
                        No partner transactions yet.
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl bg-primary/5 px-3 py-2">
                                <p className="text-[11px] uppercase text-primary/80">Total</p>
                                <p className="text-xl font-semibold">{stats.total}</p>
                            </div>
                            <div className="rounded-xl bg-emerald-50 px-3 py-2 text-emerald-700">
                                <p className="text-[11px] uppercase">Success rate</p>
                                <p className="text-xl font-semibold">{successRate}%</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <StatusRow color="bg-emerald-500" label="Completed" value={stats.completed} />
                            <StatusRow color="bg-amber-500" label="Pending" value={stats.pending} />
                            <StatusRow color="bg-rose-500" label="Failed" value={stats.failed} />
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
                            <span className="text-muted-foreground">Settled amount</span>
                            <span className="font-semibold">${stats.totalAmount.toFixed(2)}</span>
                        </div>
                        <Button asChild variant="outline" className="w-full mt-2">
                            <Link href="/dashboard/transactions">
                                View all transactions
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

function StatusRow({ color, label, value }: { color: string; label: string; value: number }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                <span className="text-sm">{label}</span>
            </div>
            <span className="text-sm font-medium">{value}</span>
        </div>
    );
}
