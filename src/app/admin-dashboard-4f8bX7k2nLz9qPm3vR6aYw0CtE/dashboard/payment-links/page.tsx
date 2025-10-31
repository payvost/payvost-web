
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Search, MoreHorizontal, Copy, Edit, BarChart2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CreatePaymentLinkForm } from '@/components/create-payment-link-form';
import { Skeleton } from '@/components/ui/skeleton';
import axios from 'axios';

interface PaymentLink {
  id: string;
  title: string;
  description?: string;
  status: string;
  clicks: number;
  paid: number;
  amountReceived: number;
  currency: string;
  created: string;
  publicUrl?: string;
  type: 'payment_link' | 'invoice';
}

interface PaymentLinkStats {
  totalRevenue: number;
  activeLinks: number;
  conversionRate: number;
  totalClicks: number;
  totalPaid: number;
  totalLinks: number;
}

type View = 'list' | 'create';

export default function PaymentLinksPage() {
    const [view, setView] = useState<View>('list');
    const [links, setLinks] = useState<PaymentLink[]>([]);
    const [stats, setStats] = useState<PaymentLinkStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    useEffect(() => {
        async function fetchPaymentLinks() {
            try {
                setLoading(true);
                setError(null);

                const response = await axios.get('/api/admin/payment-links');
                setLinks(response.data.links || []);
                setStats(response.data.stats || null);
            } catch (err: any) {
                console.error('Error fetching payment links:', err);
                setError(err.response?.data?.error || 'Failed to load payment links');
            } finally {
                setLoading(false);
            }
        }

        if (view === 'list') {
            fetchPaymentLinks();
        }
    }, [view]);

    const formatCurrency = (amount: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const copyToClipboard = (url: string) => {
        navigator.clipboard.writeText(url);
        // You could add a toast notification here
        alert('Link copied to clipboard!');
    };

    const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
        switch (status.toLowerCase()) {
            case 'active':
            case 'pending':
                return 'default';
            case 'completed':
            case 'paid':
                return 'secondary';
            case 'expired':
            case 'cancelled':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    const filteredLinks = links.filter(link =>
        link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        link.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    if (view === 'create') {
        return <CreatePaymentLinkForm onBack={() => setView('list')} />;
    }

    return (
        <>
            {error && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg">
                    <p className="text-sm text-destructive">⚠️ {error}</p>
                </div>
            )}

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
                        {loading ? (
                            <>
                                <Skeleton className="h-8 w-32 mb-2" />
                                <Skeleton className="h-4 w-40" />
                            </>
                        ) : (
                            <>
                                <div className="text-2xl font-bold">
                                    {formatCurrency(stats?.totalRevenue || 0)}
                                </div>
                                <p className="text-xs text-muted-foreground">from all payment links</p>
                            </>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Links</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <>
                                <Skeleton className="h-8 w-16 mb-2" />
                                <Skeleton className="h-4 w-40" />
                            </>
                        ) : (
                            <>
                                <div className="text-2xl font-bold">{stats?.activeLinks || 0}</div>
                                <p className="text-xs text-muted-foreground">currently accepting payments</p>
                            </>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <>
                                <Skeleton className="h-8 w-20 mb-2" />
                                <Skeleton className="h-4 w-40" />
                            </>
                        ) : (
                            <>
                                <div className="text-2xl font-bold">
                                    {stats?.conversionRate ? stats.conversionRate.toFixed(1) : '0.0'}%
                                </div>
                                <p className="text-xs text-muted-foreground">Clicks to successful payments</p>
                            </>
                        )}
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
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex items-center space-x-4">
                                    <Skeleton className="h-12 w-full" />
                                </div>
                            ))}
                        </div>
                    ) : filteredLinks.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground text-sm">
                                {searchQuery ? 'No payment links match your search' : 'No payment links yet'}
                            </p>
                            <p className="text-muted-foreground text-xs mt-2">
                                {searchQuery ? 'Try a different search term' : 'Create your first payment link to get started'}
                            </p>
                        </div>
                    ) : (
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
                                {filteredLinks.map((link) => (
                                    <TableRow key={link.id}>
                                        <TableCell>
                                            <div className="font-medium">{link.title}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {formatDate(link.created)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(link.status)}>
                                                {link.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {link.clicks} / {link.paid}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {formatCurrency(link.amountReceived, link.currency)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {link.publicUrl && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => copyToClipboard(link.publicUrl!)}
                                                    title="Copy link"
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
                {!loading && filteredLinks.length > 0 && (
                    <CardFooter>
                        <div className="text-xs text-muted-foreground">
                            Showing <strong>1-{filteredLinks.length}</strong> of <strong>{links.length}</strong> payment links
                        </div>
                    </CardFooter>
                )}
            </Card>
        </>
    );
}
