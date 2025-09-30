
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, Shield, DollarSign, FileText, Repeat, Snowflake, Power } from 'lucide-react';
import { VirtualCard } from '@/components/virtual-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import type { VirtualCardData } from '@/types/virtual-card';

const cardDetails: VirtualCardData = {
    id: 'vc_1',
    cardLabel: 'Marketing Team',
    last4: '4284',
    cardType: 'visa',
    expiry: '12/26',
    cvv: '123',
    balance: 1850.25,
    currency: 'USD',
    theme: 'blue',
    status: 'active',
    fullNumber: '4012 3456 7890 4284',
    cardModel: 'debit',
    spendingLimit: { amount: 5000, interval: 'monthly' },
    transactions: [
        { id: 'tx_1', description: 'Google Ads', amount: -250.00, date: '2024-08-15' },
        { id: 'tx_2', description: 'Facebook Ads', amount: -400.00, date: '2024-08-14' },
        { id: 'tx_3', description: 'Figma Subscription', amount: -45.00, date: '2024-08-12' },
        { id: 'tx_4', description: 'Canva Pro', amount: -12.99, date: '2024-08-10' },
    ],
};


export default function CardDetailsPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const card = cardDetails; // Fetch by params.id in real app

    const limit = card.spendingLimit?.amount ?? 0;
    const spent = card.transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    const progress = limit > 0 ? (spent / limit) * 100 : 0;
    
    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div className="flex items-center gap-4">
                     <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">{card.cardLabel}</h2>
                        <p className="text-muted-foreground">Card ID: {card.id}</p>
                    </div>
                </div>
                 <div className="flex items-center space-x-2">
                    <Button variant="outline"><DollarSign className="mr-2 h-4 w-4" />Adjust Balance</Button>
                    <Button>Edit Card</Button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <VirtualCard card={card} />
                     <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-2">
                           <Button variant="outline"><Snowflake className="mr-2 h-4 w-4"/>Freeze</Button>
                           <Button variant="outline"><Repeat className="mr-2 h-4 w-4"/>Reset PIN</Button>
                           <Button variant="outline"><FileText className="mr-2 h-4 w-4"/>Statement</Button>
                           <Button variant="destructive-outline"><Power className="mr-2 h-4 w-4"/>Terminate</Button>
                        </CardContent>
                    </Card>
                    {card.spendingLimit && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Spending Limit</CardTitle>
                                <CardDescription>
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: card.currency }).format(limit)} / Monthly
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                               <Progress value={progress} className="mb-2 h-3" />
                               <p className="text-sm text-muted-foreground">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: card.currency }).format(spent)} spent
                               </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Transaction History</CardTitle>
                            <CardDescription>Recent transactions made with this card.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {card.transactions.length > 0 ? (
                                        card.transactions.map(tx => (
                                            <TableRow key={tx.id}>
                                                <TableCell className="font-medium">{tx.description}</TableCell>
                                                <TableCell>{tx.date}</TableCell>
                                                <TableCell className="text-right font-mono">{new Intl.NumberFormat('en-US', { style: 'currency', currency: card.currency }).format(tx.amount)}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-24 text-center">No transactions yet.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Fraud & Security</CardTitle>
                            <CardDescription>Manage security settings for this card.</CardDescription>
                        </CardHeader>
                         <CardContent>
                            <div className="divide-y divide-border rounded-lg border">
                                <div className="flex items-center justify-between p-4">
                                    <p className="font-medium">Allowed Merchant Categories</p>
                                    <Button variant="secondary" size="sm">All Categories</Button>
                                </div>
                                <div className="flex items-center justify-between p-4">
                                    <p className="font-medium">Blocked Countries</p>
                                    <Button variant="secondary" size="sm">No countries blocked</Button>
                                </div>
                                <div className="flex items-center justify-between p-4">
                                    <p className="font-medium">Velocity Controls</p>
                                    <Button variant="secondary" size="sm">Default</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
