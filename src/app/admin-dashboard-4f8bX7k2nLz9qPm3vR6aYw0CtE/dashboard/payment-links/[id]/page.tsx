
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BarChart2, CheckCircle, Copy, Eye, Users, FileDown } from 'lucide-react';
import { AdminLinkAnalyticsChart } from '@/components/admin-link-analytics-chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const linkDetails = {
    id: 'pl_1', 
    title: 'UX Design Course', 
    status: 'Active', 
    clicks: 152, 
    paid: 87, 
    amountReceived: 4350, 
    currency: 'USD', 
    created: '2024-08-10',
    url: 'https://payvost.pay/pl_1a2b3c4d'
};

const recentPayments = [
    { id: 'txn_1', customer: 'liam@example.com', amount: 50.00, date: '2024-08-15' },
    { id: 'txn_2', customer: 'olivia@example.com', amount: 50.00, date: '2024-08-15' },
    { id: 'txn_3', customer: 'noah@example.com', amount: 50.00, date: '2024-08-14' },
    { id: 'txn_4', customer: 'emma@example.com', amount: 50.00, date: '2024-08-14' },
];

export default function PaymentLinkDetailsPage({ params }: { params: { id: string } }) {

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div className="flex items-center gap-4">
                     <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                        <Link href="/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/payment-links">
                           <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">{linkDetails.title}</h2>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant={linkDetails.status === 'Active' ? 'default' : 'secondary'}>{linkDetails.status}</Badge>
                            <span>ID: {linkDetails.id}</span>
                        </div>
                    </div>
                </div>
                 <div className="flex items-center space-x-2">
                    <Button variant="outline">Deactivate Link</Button>
                    <Button>Edit Link</Button>
                </div>
            </div>
            
            <Card className="mb-6">
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <span className="text-sm font-medium">Payment Link URL:</span>
                       <span className="font-mono text-sm text-muted-foreground">{linkDetails.url}</span>
                    </div>
                    <Button variant="outline" size="sm"><Copy className="mr-2 h-4 w-4" />Copy Link</Button>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <Card>
                    <CardHeader className="flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <BarChart2 className="h-4 w-4 text-muted-foreground"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${linkDetails.amountReceived.toLocaleString()}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{linkDetails.clicks}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Successful Payments</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{linkDetails.paid}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                <Card className="xl:col-span-3">
                    <CardHeader>
                        <CardTitle>Page Views vs Payments</CardTitle>
                        <CardDescription>Daily comparison of page views and successful payments.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <AdminLinkAnalyticsChart />
                    </CardContent>
                </Card>
                <Card className="xl:col-span-2">
                    <CardHeader>
                        <CardTitle>Sales Funnel</CardTitle>
                        <CardDescription>From page view to successful payment.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <Eye className="h-6 w-6 text-muted-foreground mr-4"/>
                                <div className="flex-1">
                                    <p className="font-medium">Page Views</p>
                                    <p className="text-sm text-muted-foreground">The link was viewed.</p>
                                </div>
                                <p className="font-bold text-lg">{linkDetails.clicks}</p>
                            </div>
                             <div className="flex items-center">
                                <Users className="h-6 w-6 text-muted-foreground mr-4"/>
                                <div className="flex-1">
                                    <p className="font-medium">Payments Initiated</p>
                                    <p className="text-sm text-muted-foreground">The payment form was submitted.</p>
                                </div>
                                <p className="font-bold text-lg">{linkDetails.paid + 5}</p>
                            </div>
                             <div className="flex items-center">
                                <CheckCircle className="h-6 w-6 text-green-500 mr-4"/>
                                <div className="flex-1">
                                    <p className="font-medium">Payments Successful</p>
                                    <p className="text-sm text-muted-foreground">Payment was successfully captured.</p>
                                </div>
                                <p className="font-bold text-lg">{linkDetails.paid}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <Card className="mt-6">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Recent Payments</CardTitle>
                        <Button variant="outline"><FileDown className="mr-2 h-4 w-4"/>Export</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentPayments.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-medium">{p.customer}</TableCell>
                                    <TableCell>{p.date}</TableCell>
                                    <TableCell className="text-right font-mono">${p.amount.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    );
}
