
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, Clock, AlertCircle, Printer, Download, MessageSquareWarning, ShieldQuestion, Repeat, FileJson, Code, History } from 'lucide-react';

const transactionDetails = {
    id: 'txn_1a2b3c4d',
    status: 'Successful' as const,
    date: '2024-08-15T10:30:00Z',
    customer: {
        name: 'Olivia Martin',
        email: 'olivia.martin@email.com',
    },
    payment: {
        channel: 'Stripe',
        source: 'Visa **** 4242',
        inflow: { amount: 1999.00, currency: 'USD' },
        outflow: { amount: 1999.00, currency: 'USD' },
    },
    risk: {
        level: 'Low',
        score: 12,
        checks: ['AVS Pass', 'CVV Pass', 'IP Match'],
    },
    auditTrail: [
        { status: 'Completed', date: '2024-08-15T10:30:15Z', description: 'Funds successfully captured.' },
        { status: 'Authorized', date: '2024-08-15T10:30:05Z', description: 'Payment authorized by card issuer.' },
        { status: 'Initiated', date: '2024-08-15T10:30:00Z', description: 'Transaction initiated by customer.' },
    ],
    metadata: {
        orderId: 'ORD-2024-9876',
        productId: 'PROD-VIRT-PREM',
        customerIp: '198.51.100.2',
    },
    webhook: {
        status: 'Delivered',
        url: 'https://api.example.com/webhook',
        attempts: 1,
        response: {
            statusCode: 200,
            body: '{ "status": "ok" }',
        }
    }
};

type Status = 'Successful' | 'Pending' | 'Failed';

const statusInfo: { [key in Status]: { icon: React.ReactNode; variant: 'default' | 'secondary' | 'destructive' } } = {
    Successful: { icon: <CheckCircle className="h-5 w-5 text-green-500" />, variant: 'default' },
    Pending: { icon: <Clock className="h-5 w-5 text-yellow-500" />, variant: 'secondary' },
    Failed: { icon: <AlertCircle className="h-5 w-5 text-red-500" />, variant: 'destructive' },
};


export default function AdminTransactionDetailsPage({ params }: { params: { id: string } }) {
    const transaction = transactionDetails; // Fetch by params.id in real app
    const currentStatusInfo = statusInfo[transaction.status];

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div className="flex items-center gap-4">
                     <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                        <Link href="/admin-panel/dashboard/transactions">
                           <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Transaction Details</h2>
                        <p className="text-muted-foreground">ID: {transaction.id}</p>
                    </div>
                </div>
                 <div className="flex items-center space-x-2">
                    <Button variant="outline"><Printer className="mr-2 h-4 w-4"/>Print</Button>
                    <Button variant="outline"><Download className="mr-2 h-4 w-4"/>Export</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle>Payment Overview</CardTitle>
                                <Badge variant={currentStatusInfo.variant} className="capitalize flex items-center gap-1.5">
                                    {currentStatusInfo.icon}{transaction.status}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div><p className="text-muted-foreground">Customer</p><p className="font-medium">{transaction.customer.name}</p></div>
                                <div><p className="text-muted-foreground">Inflow</p><p className="font-medium font-mono">{transaction.payment.inflow.amount.toFixed(2)} {transaction.payment.inflow.currency}</p></div>
                                <div><p className="text-muted-foreground">Outflow</p><p className="font-medium font-mono">{transaction.payment.outflow.amount.toFixed(2)} {transaction.payment.outflow.currency}</p></div>
                                <div><p className="text-muted-foreground">Channel</p><p className="font-medium">{transaction.payment.channel}</p></div>
                             </div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><History className="h-5 w-5"/>Audit Trail</CardTitle></CardHeader>
                        <CardContent>
                            <ul className="space-y-4">
                                {transaction.auditTrail.map((item, index) => (
                                    <li key={index} className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="h-3 w-3 rounded-full bg-primary mt-1"></div>
                                            {index < transaction.auditTrail.length - 1 && <div className="h-full w-px bg-border"></div>}
                                        </div>
                                        <div>
                                            <p className="font-semibold">{item.status}</p>
                                            <p className="text-sm text-muted-foreground">{item.description}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{new Date(item.date).toUTCString()}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><Code className="h-5 w-5"/>Webhook Response</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                                <div><div className="text-muted-foreground">Status</div><div><Badge variant={transaction.webhook.status === 'Delivered' ? 'default' : 'destructive'}>{transaction.webhook.status}</Badge></div></div>
                                <div><div className="text-muted-foreground">URL</div><div className="font-mono truncate">{transaction.webhook.url}</div></div>
                                <div><div className="text-muted-foreground">Attempts</div><div className="font-medium">{transaction.webhook.attempts}</div></div>
                            </div>
                            <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto"><code>{JSON.stringify(JSON.parse(transaction.webhook.response.body), null, 2)}</code></pre>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                           <Button variant="outline" className="w-full justify-start"><Repeat className="mr-2 h-4 w-4"/>Refund Transaction</Button>
                           <Button variant="destructive-outline" className="w-full justify-start"><MessageSquareWarning className="mr-2 h-4 w-4"/>Flag for Review</Button>
                           <Button variant="destructive-outline" className="w-full justify-start"><ShieldQuestion className="mr-2 h-4 w-4"/>Open Dispute</Button>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><FileJson className="h-5 w-5"/>Metadata</CardTitle></CardHeader>
                        <CardContent>
                             <dl className="space-y-2 text-sm">
                                {Object.entries(transaction.metadata).map(([key, value]) => (
                                    <div key={key} className="flex justify-between">
                                        <dt className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</dt>
                                        <dd className="font-mono">{value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
