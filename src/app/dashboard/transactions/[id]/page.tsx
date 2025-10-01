
'use client';

import { useState, useEffect } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Printer, Download, Send, CheckCircle, AlertCircle, Clock, Repeat, UserPlus, ShieldQuestion, MessageSquareWarning, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';


type Status = 'Completed' | 'Pending' | 'Failed';

const statusInfo: { [key in Status]: { icon: React.ReactNode; color: string; variant: 'default' | 'secondary' | 'destructive' } } = {
    Completed: { icon: <CheckCircle className="h-5 w-5" />, color: 'text-green-500', variant: 'default' },
    Pending: { icon: <Clock className="h-5 w-5" />, color: 'text-amber-500', variant: 'secondary' },
    Failed: { icon: <AlertCircle className="h-5 w-5" />, color: 'text-red-500', variant: 'destructive' },
};


export default function TransactionDetailsPage() {
    const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
    const params = useParams();
    const id = params.id as string;
    const { user } = useAuth();
    const [transaction, setTransaction] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !id) return;
        
        const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
            if (doc.exists()) {
                const transactions = doc.data().transactions || [];
                const foundTx = transactions.find((tx: any) => tx.id === id);
                setTransaction(foundTx || null);
            } else {
                 setTransaction(null);
            }
            setLoading(false);
        });

        return () => unsub();

    }, [user, id]);

    if (loading) {
         return (
            <DashboardLayout language={language} setLanguage={setLanguage}>
                 <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                    <Skeleton className="h-10 w-64"/>
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                             <Skeleton className="h-96 w-full"/>
                        </div>
                        <div className="lg:col-span-1 space-y-6">
                             <Skeleton className="h-48 w-full"/>
                             <Skeleton className="h-32 w-full"/>
                        </div>
                     </div>
                 </main>
            </DashboardLayout>
         )
    }

    if (!transaction) {
         return (
            <DashboardLayout language={language} setLanguage={setLanguage}>
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 items-center justify-center">
                    <AlertCircle className="h-16 w-16 text-destructive"/>
                    <h2 className="text-2xl font-bold">Transaction Not Found</h2>
                    <p className="text-muted-foreground">The requested transaction ID could not be found in your records.</p>
                     <Button asChild>
                        <Link href="/dashboard/transactions">Back to Transactions</Link>
                    </Button>
                </main>
            </DashboardLayout>
        )
    }

    const status = transaction.status as Status;
    const currentStatusInfo = statusInfo[status];

    const financials = {
        sent: { amount: parseFloat(transaction.sendAmount) || 0, currency: transaction.sendCurrency || 'USD' },
        fee: { amount: parseFloat(transaction.fee?.replace('$', '')) || 0, currency: transaction.sendCurrency || 'USD' },
        total: { amount: (parseFloat(transaction.sendAmount) || 0) + (parseFloat(transaction.fee?.replace('$', '')) || 0), currency: transaction.sendCurrency || 'USD' },
        exchangeRate: transaction.exchangeRate,
        received: { amount: parseFloat(transaction.recipientGets) || 0, currency: transaction.recipientCurrency || 'USD' },
    };

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
                                        <p>Your {financials.sent.currency} Wallet</p>
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-semibold">To</h4>
                                        <p>{transaction.recipientName}</p>
                                    </div>
                                </div>
                                <Separator />
                                <div>
                                    <h4 className="font-semibold mb-2">Financial Breakdown</h4>
                                    <dl className="space-y-2">
                                        <div className="flex justify-between">
                                            <dt>Amount Sent</dt>
                                            <dd className="font-mono">{financials.sent.amount.toFixed(2)} {financials.sent.currency}</dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt>Fee</dt>
                                            <dd className="font-mono">{financials.fee.amount.toFixed(2)} {financials.fee.currency}</dd>
                                        </div>
                                         <div className="flex justify-between text-muted-foreground text-sm">
                                            <dt>Exchange Rate</dt>
                                            <dd className="font-mono">{financials.exchangeRate}</dd>
                                        </div>
                                        <Separator />
                                        <div className="flex justify-between font-bold">
                                            <dt>Total Paid</dt>
                                            <dd className="font-mono">{financials.total.amount.toFixed(2)} {financials.total.currency}</dd>
                                        </div>
                                        <div className="flex justify-between font-bold text-lg text-primary">
                                            <dt>Recipient Received</dt>
                                            <dd className="font-mono">{financials.received.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} {financials.received.currency}</dd>
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
                    </div>
                </div>
            </main>
        </DashboardLayout>
    );
}
