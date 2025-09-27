
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, CreditCard, Shield, SlidersHorizontal, Search } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { VirtualCardData } from '@/types/virtual-card';

const sampleCards: VirtualCardData[] = [
    { id: 'vc_1', cardLabel: 'Marketing Team', last4: '4284', cardType: 'visa', balance: 2500.75, currency: 'USD', status: 'active', fullNumber: '', expiry: '', cvv: '', transactions: [] },
    { id: 'vc_2', cardLabel: 'Development Subscriptions', last4: '8932', cardType: 'mastercard', balance: 500.20, currency: 'USD', status: 'active', fullNumber: '', expiry: '', cvv: '', transactions: [] },
    { id: 'vc_3', cardLabel: 'CEO Travel Card', last4: '7766', cardType: 'visa', balance: 10000.00, currency: 'USD', status: 'frozen', fullNumber: '', expiry: '', cvv: '', transactions: [] },
    { id: 'vc_4', cardLabel: 'UK Office Expenses', last4: '9876', cardType: 'visa', balance: 8500.00, currency: 'GBP', status: 'active', fullNumber: '', expiry: '', cvv: '', transactions: [] },
    { id: 'vc_5', cardLabel: 'Terminated Card', last4: '1111', cardType: 'mastercard', balance: 0.00, currency: 'USD', status: 'terminated', fullNumber: '', expiry: '', cvv: '', transactions: [] },
];

export default function CardManagementPage() {
    const router = useRouter();

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Card Management</h2>
                    <p className="text-muted-foreground">Issue, manage, and monitor all virtual cards.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline"><SlidersHorizontal className="mr-2 h-4 w-4"/>Configure Rules</Button>
                    <Button onClick={() => router.push('/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/card-management/create')}><PlusCircle className="mr-2 h-4 w-4" />Issue New Card</Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Active Cards</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1,254</div>
                        <p className="text-xs text-muted-foreground">+201 from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Spending (30d)</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$2,350,123.50</div>
                        <p className="text-xs text-muted-foreground">+180.1% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Fraud Blocks (24h)</CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12</div>
                        <p className="text-xs text-muted-foreground">+5 since last hour</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search by card label, last 4 digits, or user..."
                            className="w-full rounded-lg bg-background pl-8 md:w-[320px]"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Card</TableHead>
                                <TableHead>User / Team</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Balance</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sampleCards.map((card) => (
                                <TableRow key={card.id} onClick={() => router.push(`/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/card-management/${card.id}`)} className="cursor-pointer">
                                    <TableCell>
                                        <div className="font-medium">{card.cardLabel}</div>
                                        <div className="text-sm text-muted-foreground font-mono">•••• {card.last4}</div>
                                    </TableCell>
                                    <TableCell>Marketing Team</TableCell>
                                    <TableCell>
                                        <Badge variant={card.status === 'active' ? 'default' : card.status === 'frozen' ? 'secondary' : 'destructive'} className="capitalize">{card.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-mono">{new Intl.NumberFormat('en-US', { style: 'currency', currency: card.currency }).format(card.balance)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    );
}
