
import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, FileText } from 'lucide-react';
import { DocumentData } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface InvoiceOverviewProps {
    invoices: DocumentData[];
    loading: boolean;
    isKycVerified: boolean;
}

export function InvoiceOverview({ invoices, loading, isKycVerified }: InvoiceOverviewProps) {
    const formatAmount = (invoice: DocumentData) => {
        const currency = invoice.currency || 'USD';
        const rawAmount = invoice.grandTotal ?? invoice.totalAmount ?? invoice.amount ?? 0;
        const amount = typeof rawAmount === 'number' ? rawAmount : parseFloat(rawAmount);
        const safeAmount = Number.isFinite(amount) ? amount : 0;
        return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(safeAmount);
    };

    const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
        Paid: 'default',
        Pending: 'secondary',
        Overdue: 'destructive',
        Draft: 'outline',
    };

    const statusCounts = useMemo(() => {
        return invoices.reduce(
            (acc, invoice) => {
                const key = (invoice.status || 'Pending').toLowerCase();
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            },
            {} as Record<string, number>
        );
    }, [invoices]);

    return (
        <Card className="border-muted-foreground/15 shadow-sm">
            <CardHeader className="flex flex-row items-center gap-3">
                <div className="grid gap-1">
                    <CardTitle className="text-sm font-semibold">Invoices</CardTitle>
                    <CardDescription className="text-xs">Latest requests and their payment states.</CardDescription>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <Badge variant="secondary" className="text-[11px] bg-emerald-50 text-emerald-700">
                        {statusCounts.paid || 0} paid
                    </Badge>
                    <Badge variant="outline" className="text-[11px]">
                        {statusCounts.pending || 0} pending
                    </Badge>
                    <Button asChild size="sm" className="gap-1" disabled={!isKycVerified}>
                        <Link href="/dashboard/request-payment?tab=invoice">
                            View all <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center py-4">Loading invoices...</div>
                ) : invoices.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        No invoices created yet.
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Client</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices.map((invoice) => (
                                <TableRow key={invoice.id}>
                                    <TableCell className="font-medium">{invoice.toName || invoice.clientName || 'Unknown'}</TableCell>
                                    <TableCell>{formatAmount(invoice)}</TableCell>
                                    <TableCell>
                                        <Badge variant={statusVariant[invoice.status] || 'secondary'}>
                                            {invoice.status || 'Pending'}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
