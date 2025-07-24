
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Search, MoreHorizontal, Copy, Edit, BarChart2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CreatePaymentLinkForm } from '@/components/create-payment-link-form';

const sampleLinks = [
    { id: 'pl_1', title: 'UX Design Course', status: 'Active', clicks: 152, paid: 87, amountReceived: 4350, currency: 'USD', created: '2024-08-10' },
    { id: 'pl_2', title: 'Consulting Call', status: 'Active', clicks: 25, paid: 18, amountReceived: 2700, currency: 'USD', created: '2024-08-08' },
    { id: 'pl_3', title: 'E-book "Intro to Remittances"', status: 'Expired', clicks: 540, paid: 350, amountReceived: 3496.5, currency: 'USD', created: '2024-06-01' },
    { id: 'pl_4', title: 'Webinar Ticket', status: 'Active', clicks: 88, paid: 80, amountReceived: 800, currency: 'USD', created: '2024-08-05' },
    { id: 'pl_5', title: 'Donation for Cause', status: 'Archived', clicks: 1200, paid: 950, amountReceived: 9500, currency: 'USD', created: '2024-05-20' },
];

type View = 'list' | 'create';

export default function PaymentLinksPage() {
    const [view, setView] = useState<View>('list');
    
    if (view === 'create') {
        return <CreatePaymentLinkForm onBack={() => setView('list')} />;
    }

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Payment Links</h2>
                    <p className="text-muted-foreground">Create and manage reusable payment links.</p>
                </div>
                <Button onClick={() => setView('create')}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Payment Link
                </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$20,846.50</div>
                        <p className="text-xs text-muted-foreground">from all payment links</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Links</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">3</div>
                        <p className="text-xs text-muted-foreground">currently accepting payments</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">64.1%</div>
                        <p className="text-xs text-muted-foreground">Clicks to successful payments</p>
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search by link title or ID..."
                            className="w-full rounded-lg bg-background pl-8 md:w-[320px]"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Clicks / Paid</TableHead>
                                <TableHead className="text-right">Amount Received</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sampleLinks.map((link) => (
                                <TableRow key={link.id}>
                                    <TableCell>
                                        <Link href={`/admin-panel/dashboard/payment-links/${link.id}`} className="font-medium hover:underline">{link.title}</Link>
                                        <div className="text-xs text-muted-foreground">{link.created}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={link.status === 'Active' ? 'default' : 'secondary'}>{link.status}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {link.clicks} / {link.paid}
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: link.currency }).format(link.amountReceived)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon">
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter>
                     <div className="text-xs text-muted-foreground">
                        Showing <strong>1-5</strong> of <strong>{sampleLinks.length}</strong> payment links
                    </div>
                </CardFooter>
            </Card>
        </>
    );
}
