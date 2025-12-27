
import React from 'react';
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
    return (
        <Card>
            <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                    <CardTitle>Invoice Overview</CardTitle>
                    <CardDescription>Recent invoices and their statuses.</CardDescription>
                </div>
                <Button asChild size="sm" className="ml-auto gap-1" disabled={!isKycVerified}>
                    <Link href="/dashboard/request-payment?tab=invoice">
                        View All <ArrowRight className="h-4 w-4" />
                    </Link>
                </Button>
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
                                    <TableCell className="font-medium">{invoice.clientName || 'Unknown'}</TableCell>
                                    <TableCell>${invoice.totalAmount || invoice.amount || '0.00'}</TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            invoice.status === 'PAID' ? 'default' :
                                                invoice.status === 'PENDING' ? 'outline' : 'secondary'
                                        }>
                                            {invoice.status}
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
