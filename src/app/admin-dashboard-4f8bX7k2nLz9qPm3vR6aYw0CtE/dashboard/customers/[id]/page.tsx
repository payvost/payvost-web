
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldCheck, Mail, Phone, Calendar, Globe, User, Shield, BarChart, Wallet, MessageSquareWarning, Repeat, Power, CircleDollarSign, Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { CustomerData, KycStatus, UserType } from '@/types/customer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import axios from 'axios';


const kycStatusConfig: Record<KycStatus, { icon: React.ReactNode; color: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    Verified: { icon: <ShieldCheck className="h-5 w-5" />, color: 'text-green-600', variant: 'default' },
    Pending: { icon: <ShieldCheck className="h-5 w-5" />, color: 'text-yellow-600', variant: 'secondary' },
    Unverified: { icon: <ShieldCheck className="h-5 w-5" />, color: 'text-gray-600', variant: 'outline' },
    Restricted: { icon: <ShieldCheck className="h-5 w-5" />, color: 'text-orange-600', variant: 'destructive' },
};


export default function CustomerDetailsPage() {
    const params = useParams();
    const id = params?.id as string;
    const [customer, setCustomer] = useState<CustomerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCustomer = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`/api/admin/customers/${id}`);
                setCustomer(response.data);
            } catch (err) {
                console.error('Error fetching customer:', err);
                setError('Failed to load customer data');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchCustomer();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-96 w-full" />
                    </div>
                    <div className="lg:col-span-1 space-y-6">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !customer) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <ShieldCheck className="h-16 w-16 text-muted-foreground" />
                <h2 className="text-2xl font-bold">Customer Not Found</h2>
                <p className="text-muted-foreground">{error || 'The requested customer could not be found.'}</p>
                <Button asChild>
                    <Link href="/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/customers">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Customers
                    </Link>
                </Button>
            </div>
        );
    }

    const status = kycStatusConfig[customer.kycStatus as KycStatus];
    
    // Format joined date
    const formatDate = (date: any) => {
        if (!date) return 'N/A';
        if (typeof date === 'string') return new Date(date).toLocaleDateString();
        if (date.toDate) return date.toDate().toLocaleDateString();
        if (date._seconds) return new Date(date._seconds * 1000).toLocaleDateString();
        return 'N/A';
    };

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div className="flex items-center gap-4">
                     <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                        <Link href="/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/customers">
                           <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={customer.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name)}&background=random`} />
                        <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-3xl font-bold tracking-tight">{customer.name}</h2>
                             <Badge variant={status.variant} className={cn("capitalize", status.color.replace('text-','bg-').replace('-600','-500/20'))}>
                                {status.icon} {customer.kycStatus}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">{customer.email}</p>
                    </div>
                </div>
                 <div className="flex items-center space-x-2">
                    <Button variant="outline"><Repeat className="mr-2 h-4 w-4" />Reset Password</Button>
                    <Button variant="destructive"><Power className="mr-2 h-4 w-4" />Suspend</Button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Customer Profile</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div><p className="text-muted-foreground flex items-center gap-1"><User className="h-4 w-4" /> User Type</p><p className="font-medium pl-5">{customer.userType}</p></div>
                            <div><p className="text-muted-foreground flex items-center gap-1"><Phone className="h-4 w-4" /> Phone</p><p className="font-medium pl-5">{customer.phone}</p></div>
                            <div><p className="text-muted-foreground flex items-center gap-1"><Globe className="h-4 w-4" /> Country</p><p className="font-medium pl-5">{customer.country}</p></div>
                            <div><p className="text-muted-foreground flex items-center gap-1"><Calendar className="h-4 w-4" /> Joined</p><p className="font-medium pl-5">{formatDate(customer.joinedDate)}</p></div>
                        </CardContent>
                    </Card>

                    {customer.associatedAccounts && customer.associatedAccounts.length > 0 && (
                         <Card>
                            <CardHeader>
                                <CardTitle>Associated Accounts</CardTitle>
                                <CardDescription>This user owns or is a member of the following accounts.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="divide-y divide-border">
                                {customer.associatedAccounts.map(account => (
                                    <div key={account.id} className="flex items-center justify-between py-3">
                                        <div className="flex items-center gap-3">
                                            <Briefcase className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <p className="font-semibold">{account.name}</p>
                                                <p className="text-sm text-muted-foreground">{account.type} Account</p>
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/business-accounts/${account.id}`}>View Account</Link>
                                        </Button>
                                    </div>
                                ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Transactions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {customer.transactions && customer.transactions.length > 0 ? (
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Transaction ID</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {customer.transactions.map((tx) => (
                                        <TableRow key={tx.id}>
                                            <TableCell className="font-mono text-xs">{tx.id}</TableCell>
                                            <TableCell><Badge variant="outline" className="capitalize">{tx.type}</Badge></TableCell>
                                            <TableCell><Badge variant="default" className="capitalize">{tx.status}</Badge></TableCell>
                                            <TableCell className="text-right font-mono">{new Intl.NumberFormat('en-US', { style: 'currency', currency: tx.currency }).format(tx.amount)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Wallet className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>No transactions found</p>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter>
                            <Button variant="secondary">View All Transactions</Button>
                        </CardFooter>
                    </Card>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><CircleDollarSign className="h-5 w-5"/>Account Value</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Spend</p>
                                <p className="text-2xl font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(customer.totalSpend)}</p>
                            </div>
                             <Separator />
                              <div>
                                <p className="text-sm text-muted-foreground mb-2">Wallet Balances</p>
                                {customer.wallets && customer.wallets.length > 0 ? (
                                <div className="space-y-2">
                                {customer.wallets.map(wallet => (
                                    <div key={wallet.currency} className="flex justify-between items-center">
                                        <span className="font-medium">{wallet.currency}</span>
                                        <span className="font-mono">{new Intl.NumberFormat('en-US', { style: 'currency', currency: wallet.currency, maximumFractionDigits: 2 }).format(wallet.balance)}</span>
                                    </div>
                                ))}
                                </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No wallets configured</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5"/>Risk & Security</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div>
                                <p className="text-sm text-muted-foreground">Internal Risk Score</p>
                                <p className="text-2xl font-bold">{customer.riskScore} / 100</p>
                            </div>
                            <Button variant="outline" className="w-full justify-start"><MessageSquareWarning className="mr-2 h-4 w-4"/>Flag for Review</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
