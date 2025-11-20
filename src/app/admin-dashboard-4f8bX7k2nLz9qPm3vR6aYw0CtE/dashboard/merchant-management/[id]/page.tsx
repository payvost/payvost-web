
'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, Clock, XCircle, AlertTriangle, ShieldCheck, FileUp, MessageSquareWarning, BarChart2, Users, FileText, Download, Eye, Power, CircleDollarSign, Percent } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { MerchantAccountData } from '@/types/merchant';

const merchantDetails: MerchantAccountData = {
    id: 'merch_1',
    name: 'Creatify Studio',
    status: 'Active',
    balance: 15230.50,
    currency: 'USD',
    payoutSchedule: 'Daily',
    onboardedDate: '2024-08-01',
    complianceStatus: 'Verified',
    platformFee: 1.5,
    transactions: [
        { id: 'txn_1', amount: 250, currency: 'USD', status: 'succeeded', date: '2024-08-15' },
        { id: 'txn_2', amount: 120, currency: 'USD', status: 'succeeded', date: '2024-08-15' },
        { id: 'txn_3', amount: 300, currency: 'USD', status: 'succeeded', date: '2024-08-14' },
    ],
    contactEmail: 'hello@creatify.co',
    website: 'https://creatify.co',
};

const statusConfig: Record<MerchantAccountData['status'], { icon: React.ReactElement; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    Active: { icon: <ShieldCheck className="h-5 w-5 text-green-500" />, variant: 'default' as const },
    Restricted: { icon: <AlertTriangle className="h-5 w-5 text-orange-500" />, variant: 'destructive' as const },
    'Payouts Held': { icon: <Clock className="h-5 w-5 text-yellow-500" />, variant: 'secondary' as const },
    Suspended: { icon: <XCircle className="h-5 w-5 text-red-500" />, variant: 'destructive' as const },
};

export default function MerchantDetailsPage({ params }: { params: { id: string } }) {
    const merchant = merchantDetails; // Fetch by params.id in real app
    const status = statusConfig[merchant.status];

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div className="flex items-center gap-4">
                     <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                        <Link href="/admin-panel/dashboard/merchant-management">
                           <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-3xl font-bold tracking-tight">{merchant.name}</h2>
                             <Badge variant={status.variant} className="capitalize">
                                {React.cloneElement(status.icon, { className: 'h-4 w-4 mr-1' })} {merchant.status}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">ID: {merchant.id}</p>
                    </div>
                </div>
                 <div className="flex items-center space-x-2">
                    <Button variant="outline"><Eye className="mr-2 h-4 w-4" />Impersonate</Button>
                    <Button variant="destructive"><Power className="mr-2 h-4 w-4" />Suspend</Button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Merchant Profile</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div><p className="text-muted-foreground">Website</p><p className="font-medium">{merchant.website}</p></div>
                            <div><p className="text-muted-foreground">Contact</p><p className="font-medium">{merchant.contactEmail}</p></div>
                            <div><p className="text-muted-foreground">Onboarded</p><p className="font-medium">{merchant.onboardedDate}</p></div>
                            <div><p className="text-muted-foreground">Compliance</p><p className="font-medium">{merchant.complianceStatus}</p></div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Transactions</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Transaction ID</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {merchant.transactions.map((tx) => (
                                        <TableRow key={tx.id}>
                                            <TableCell className="font-mono text-xs">{tx.id}</TableCell>
                                            <TableCell><Badge variant="default" className="capitalize">{tx.status}</Badge></TableCell>
                                            <TableCell className="text-right font-mono">{new Intl.NumberFormat('en-US', { style: 'currency', currency: tx.currency }).format(tx.amount)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                        <CardFooter>
                            <Button variant="secondary">View All Transactions</Button>
                        </CardFooter>
                    </Card>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><CircleDollarSign className="h-5 w-5"/>Balance & Payouts</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Available Balance</p>
                                <p className="text-2xl font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: merchant.currency }).format(merchant.balance)}</p>
                            </div>
                             <div>
                                <p className="text-sm text-muted-foreground">Payout Schedule</p>
                                <p className="text-lg font-medium">{merchant.payoutSchedule}</p>
                            </div>
                        </CardContent>
                         <CardFooter>
                            <Button variant="outline" className="w-full">Initiate Payout</Button>
                        </CardFooter>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Percent className="h-5 w-5"/>Platform Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Platform Fee</p>
                                <p className="text-lg font-medium">{merchant.platformFee}%</p>
                            </div>
                        </CardContent>
                         <CardFooter>
                            <Button variant="outline" className="w-full">Adjust Settings</Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </>
    );
}
