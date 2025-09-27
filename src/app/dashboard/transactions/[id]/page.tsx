
'use client';

import { useState } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Printer, Download, Send, CheckCircle, AlertCircle, Clock, Repeat, UserPlus, ShieldQuestion, MessageSquareWarning } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

// Dummy data for a single transaction - in a real app, you'd fetch this by ID
const transactionDetails = {
    id: 'txn_01',
    status: 'Completed',
    date: '2024-05-23T14:30:00Z',
    from: {
        name: 'Your USD Wallet',
        account: '•••• 1234',
    },
    to: {
        name: 'John Doe',
        account: 'GTBank •••• 5678',
    },
    financials: {
        sent: { amount: 250.00, currency: 'USD' },
        fee: { amount: 5.00, currency: 'USD' },
        total: { amount: 255.00, currency: 'USD' },
        exchangeRate: '1 USD = 1,450.50 NGN',
        received: { amount: 362625.00, currency: 'NGN' },
    }
};

type Status = 'Completed' | 'Pending' | 'Failed';

const statusInfo: { [key in Status]: { icon: React.ReactNode; color: string; variant: 'default' | 'secondary' | 'destructive' } } = {
    Completed: { icon: <CheckCircle className="h-5 w-5" />, color: 'text-green-500', variant: 'default' },
    Pending: { icon: <Clock className="h-5 w-5" />, color: 'text-amber-500', variant: 'secondary' },
    Failed: { icon: <AlertCircle className="h-5 w-5" />, color: 'text-red-500', variant: 'destructive' },
};


export default function TransactionDetailsPage({ params }: { params: { id: string } }) {
    const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
    // For now, we use dummy data. In a real app, you'd fetch based on `params.id`
    const transaction = transactionDetails;
    const status = transaction.status as Status;
    const currentStatusInfo = statusInfo[status];

    return (
        <DashboardLayout language={language} setLanguage={setLanguage}>
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                        <Link href="/dashboard/transactions">
                           <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h1 className="text-lg font-semibold md:text-2xl">Transaction Details</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-2xl">Receipt</CardTitle>
                                        <CardDescription>Transaction ID: {transaction.id}</CardDescription>
                                    </div>
                                    <Badge variant={currentStatusInfo.variant} className="capitalize flex items-center gap-1 text-lg">
                                        {currentStatusInfo.icon} {transaction.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <Separator />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <h4 className="font-semibold">From</h4>
                                        <p>{transaction.from.name}</p>
                                        <p className="text-muted-foreground text-sm">{transaction.from.account}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-semibold">To</h4>
                                        <p>{transaction.to.name}</p>
                                        <p className="text-muted-foreground text-sm">{transaction.to.account}</p>
                                    </div>
                                </div>
                                <Separator />
                                <div>
                                    <h4 className="font-semibold mb-2">Financial Breakdown</h4>
                                    <dl className="space-y-2">
                                        <div className="flex justify-between">
                                            <dt>Amount Sent</dt>
                                            <dd className="font-mono">{transaction.financials.sent.amount.toFixed(2)} {transaction.financials.sent.currency}</dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt>Fee</dt>
                                            <dd className="font-mono">{transaction.financials.fee.amount.toFixed(2)} {transaction.financials.fee.currency}</dd>
                                        </div>
                                         <div className="flex justify-between text-muted-foreground text-sm">
                                            <dt>Exchange Rate</dt>
                                            <dd className="font-mono">{transaction.financials.exchangeRate}</dd>
                                        </div>
                                        <Separator />
                                        <div className="flex justify-between font-bold">
                                            <dt>Total Paid</dt>
                                            <dd className="font-mono">{transaction.financials.total.amount.toFixed(2)} {transaction.financials.total.currency}</dd>
                                        </div>
                                        <div className="flex justify-between font-bold text-lg text-primary">
                                            <dt>Recipient Received</dt>
                                            <dd className="font-mono">{transaction.financials.received.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} {transaction.financials.received.currency}</dd>
                                        </div>
                                    </dl>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="lg:col-span-1 space-y-6">
                        <Card>
                            <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
                            <CardContent className="space-y-2">
                                <Button variant="outline" className="w-full justify-start"><Printer className="mr-2 h-4 w-4" /> Print Receipt</Button>
                                <Button variant="outline" className="w-full justify-start"><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
                                <Button variant="outline" className="w-full justify-start"><Send className="mr-2 h-4 w-4" /> Send via Email</Button>
                                <Separator className="my-2" />
                                <Button variant="secondary" className="w-full justify-start"><Repeat className="mr-2 h-4 w-4" /> Repeat Transaction</Button>
                                <Button variant="secondary" className="w-full justify-start"><UserPlus className="mr-2 h-4 w-4" /> Save as Beneficiary</Button>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Support</CardTitle></CardHeader>
                             <CardContent className="space-y-2">
                                <Button variant="outline" className="w-full justify-start"><MessageSquareWarning className="mr-2 h-4 w-4" /> Report an Issue</Button>
                                <Button variant="destructive-outline" className="w-full justify-start"><ShieldQuestion className="mr-2 h-4 w-4" /> Dispute Transaction</Button>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
                            <CardContent>
                                <ul className="space-y-4">
                                    <li className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="h-3 w-3 rounded-full bg-green-500"></div>
                                            <div className="h-full w-px bg-border"></div>
                                        </div>
                                        <div>
                                            <p className="font-semibold">Transaction Completed</p>
                                            <p className="text-sm text-muted-foreground">{new Date(transaction.date).toLocaleString()}</p>
                                        </div>
                                    </li>
                                     <li className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="h-3 w-3 rounded-full bg-green-500"></div>
                                            <div className="h-full w-px bg-border"></div>
                                        </div>
                                        <div>
                                            <p className="font-semibold">Funds Sent to Partner</p>
                                            <p className="text-sm text-muted-foreground">{new Date(new Date(transaction.date).getTime() - 5*60000).toLocaleString()}</p>
                                        </div>
                                    </li>
                                     <li className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="h-3 w-3 rounded-full bg-green-500"></div>
                                        </div>
                                        <div>
                                            <p className="font-semibold">Transaction Initiated</p>
                                            <p className="text-sm text-muted-foreground">{new Date(new Date(transaction.date).getTime() - 10*60000).toLocaleString()}</p>
                                        </div>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </DashboardLayout>
    );
}

    