
'use client';

import { useState, useEffect } from 'react';
import { CreateRecurringPaymentForm } from './create-recurring-payment-form';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Repeat, Search } from 'lucide-react';
import { Input } from './ui/input';
import { useAuth } from '@/hooks/use-auth';
import { collection, onSnapshot, query, DocumentData, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from './ui/skeleton';
import { format } from 'date-fns';
import Link from 'next/link';


const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
    Active: 'default',
    Paused: 'secondary',
    Cancelled: 'destructive',
};

export function RecurringTab() {
    const [view, setView] = useState('list');
    const [payments, setPayments] = useState<DocumentData[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const [isKycVerified, setIsKycVerified] = useState(false);


    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        };

        const userUnsub = onSnapshot(doc(db, "users", user.uid), (snapshot: any) => {
            if (snapshot.exists()) {
                const status = snapshot.data()?.kycStatus;
                setIsKycVerified(typeof status === 'string' && status.toLowerCase() === 'verified');
            }
        });

        const q = query(collection(db, "users", user.uid, "scheduledPayments"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const paymentsData: DocumentData[] = [];
            querySnapshot.forEach((doc) => {
                paymentsData.push({ id: doc.id, ...doc.data() });
            });
            setPayments(paymentsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching recurring payments: ", error);
            setLoading(false);
        });

        return () => {
            unsubscribe();
            userUnsub();
        };
    }, [user]);

    if (view === 'create') {
        return <CreateRecurringPaymentForm onBack={() => setView('list')} />;
    }
    
    if (loading) {
        return (
             <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-80" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (payments.length === 0) {
        return (
            <Card className="h-96">
                <CardContent className="flex flex-col items-center justify-center h-full text-center">
                    <Repeat className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-2xl font-bold tracking-tight">No recurring payments yet</h3>
                    <p className="text-sm text-muted-foreground mb-6">Set up automatic payments and never miss a due date.</p>
                    <Button onClick={() => setView('create')} disabled={!isKycVerified}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Schedule First Payment
                    </Button>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Recurring Payments</CardTitle>
                        <CardDescription>Manage your scheduled and automatic payments.</CardDescription>
                    </div>
                    <Button onClick={() => setView('create')} disabled={!isKycVerified}><PlusCircle className="mr-2 h-4 w-4" />Schedule New Payment</Button>
                </div>
                <div className="relative mt-4">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search by recipient..."
                        className="w-full rounded-lg bg-background pl-8 md:w-[320px]"
                    />
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Recipient</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Frequency</TableHead>
                            <TableHead>Next Payment</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                            <TableHead><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payments.map((payment) => (
                            <TableRow key={payment.id}>
                                <TableCell className="font-medium">{payment.recipient}</TableCell>
                                <TableCell>{payment.amount.toFixed(2)} {payment.currency}</TableCell>
                                <TableCell className="capitalize">{payment.frequency}</TableCell>
                                <TableCell>{format(payment.startDate.toDate(), 'PPP')}</TableCell>
                                <TableCell className="text-right">
                                    <Badge variant={statusVariant[payment.status]}>{payment.status}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem asChild>
                                                <Link href={`/dashboard/request-payment/recurring/${payment.id}`}>View History</Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>Edit</DropdownMenuItem>
                                            <DropdownMenuItem>Pause</DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive">Cancel</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
            <CardFooter>
                <div className="text-xs text-muted-foreground">
                    Showing <strong>1-{payments.length}</strong> of <strong>{payments.length}</strong> recurring payments
                </div>
            </CardFooter>
        </Card>
    );
}
