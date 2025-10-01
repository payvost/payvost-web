
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Repeat, Edit, Pause, Trash2, CheckCircle, Clock, XCircle, AlertTriangle, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import type { RecurringPayment, RecurringPaymentStatus } from '@/types/recurring-payment';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

const statusConfig: Record<RecurringPaymentStatus, { icon: React.ReactNode; variant: 'default' | 'secondary' | 'destructive' }> = {
    Active: { icon: <Clock className="h-5 w-5 text-green-500" />, variant: 'default' },
    Paused: { icon: <Pause className="h-5 w-5 text-yellow-500" />, variant: 'secondary' },
    Cancelled: { icon: <XCircle className="h-5 w-5 text-red-500" />, variant: 'destructive' },
    Completed: { icon: <CheckCircle className="h-5 w-5 text-blue-500" />, variant: 'secondary' },
};

export default function RecurringPaymentDetailsPage() {
    const params = useParams();
    const id = params.id as string;
    const { user } = useAuth();
    const [schedule, setSchedule] = useState<RecurringPayment | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        if (!user || !id) {
            setLoading(false);
            return;
        };

        const docRef = doc(db, "users", user.uid, "scheduledPayments", id);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                setSchedule({ id: docSnap.id, ...docSnap.data() } as RecurringPayment);
            } else {
                setSchedule(null);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching recurring payment:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, id]);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "Copied to clipboard!",
            description: "The ID has been copied to your clipboard.",
        });
    };

     if (loading) {
        return (
            <DashboardLayout language={'en'} setLanguage={() => {}}>
                 <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                    <Skeleton className="h-10 w-64"/>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2"><Skeleton className="h-96 w-full"/></div>
                        <div className="lg:col-span-1 space-y-6"><Skeleton className="h-64 w-full"/></div>
                    </div>
                 </main>
            </DashboardLayout>
        )
    }

    if (!schedule) {
         return (
            <DashboardLayout language={'en'} setLanguage={() => {}}>
                <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4 lg:gap-6 lg:p-6">
                    <AlertTriangle className="h-16 w-16 text-destructive"/>
                    <h2 className="text-2xl font-bold">Schedule Not Found</h2>
                    <p className="text-muted-foreground">The requested recurring payment could not be found.</p>
                     <Button asChild>
                        <Link href="/dashboard/request-payment?tab=recurring">Back to Recurring Payments</Link>
                    </Button>
                </main>
            </DashboardLayout>
        )
    }
    
    const currentStatus = statusConfig[schedule.status];

    return (
        <DashboardLayout language={'en'} setLanguage={() => {}}>
             <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                 <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                            <Link href="/dashboard/request-payment?tab=recurring">
                               <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Recurring Payment to {schedule.recipient}</h1>
                            <div className="flex items-center gap-2">
                                <p className="text-muted-foreground text-sm">ID: {schedule.id}</p>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(schedule.id)}>
                                    <Copy className="h-4 w-4" />
                                    <span className="sr-only">Copy ID</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    <div className="lg:col-span-2">
                        <Card>
                             <CardHeader>
                                <CardTitle>Transaction History</CardTitle>
                                <CardDescription>A log of all payments made under this schedule.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {schedule.transactionHistory?.length > 0 ? schedule.transactionHistory.map(tx => (
                                            <TableRow key={tx.id}>
                                                <TableCell>{format(tx.date.toDate(), 'PPP')}</TableCell>
                                                <TableCell><Badge variant={tx.status === 'Success' ? 'default' : 'destructive'}>{tx.status}</Badge></TableCell>
                                                <TableCell className="text-right font-mono">{tx.amount.toFixed(2)} {schedule.currency}</TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow><TableCell colSpan={3} className="text-center h-24">No transactions have occurred yet.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="lg:col-span-1 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Schedule Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant={currentStatus.variant} className="capitalize">{schedule.status}</Badge></div>
                                <Separator />
                                <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-semibold">{schedule.amount.toFixed(2)} {schedule.currency}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Frequency</span><span className="font-semibold capitalize">{schedule.frequency}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Start Date</span><span className="font-semibold">{format(schedule.startDate.toDate(), 'PPP')}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">End Date</span><span className="font-semibold">{schedule.endDate ? format(schedule.endDate.toDate(), 'PPP') : 'Never'}</span></div>
                                {schedule.notes && <div className="space-y-1"><p className="text-muted-foreground">Notes</p><p className="font-semibold">{schedule.notes}</p></div>}
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
                            <CardContent className="space-y-2">
                                <Button variant="outline" className="w-full justify-start"><Edit className="mr-2 h-4 w-4"/>Edit Schedule</Button>
                                <Button variant="outline" className="w-full justify-start"><Pause className="mr-2 h-4 w-4"/>Pause Schedule</Button>
                                <Button variant="destructive-outline" className="w-full justify-start"><Trash2 className="mr-2 h-4 w-4"/>Cancel Schedule</Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </DashboardLayout>
    )
}
