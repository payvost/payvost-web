
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Search, MoreHorizontal, Copy, Edit, BarChart2, Download, RefreshCw, Trash2, CheckSquare, Square, Eye, TrendingUp, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CreatePaymentLinkForm } from '@/components/create-payment-link-form';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
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
    const [selectedLinks, setSelectedLinks] = useState<string[]>([]);
    const { toast } = useToast();
    
    const fetchPaymentLinks = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axios.get('/api/admin/payment-links');
            const linksData = response.data.links || [];
            
            // Normalize date fields to strings
            const normalizedLinks = linksData.map((link: any) => ({
                ...link,
                created: link.created instanceof Date 
                    ? link.created.toISOString() 
                    : typeof link.created === 'string' 
                        ? link.created 
                        : link.createdAt 
                            ? (link.createdAt instanceof Date ? link.createdAt.toISOString() : link.createdAt)
                            : new Date().toISOString(),
            }));
            
            setLinks(normalizedLinks);
            setStats(response.data.stats || null);
        } catch (err: any) {
            console.error('Error fetching payment links:', err);
            setError(err.response?.data?.error || 'Failed to load payment links');
            toast({
                title: 'Error',
                description: err.response?.data?.error || 'Failed to load payment links',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
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

    const formatDate = (dateInput: string | Date) => {
        try {
            const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
            if (isNaN(date.getTime())) {
                return 'Invalid date';
            }
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        } catch (error) {
            return 'Invalid date';
        }
    };

    const copyToClipboard = (url: string) => {
        navigator.clipboard.writeText(url);
        toast({
            title: 'Copied!',
            description: 'Payment link copied to clipboard',
        });
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
                <div className="flex items-center gap-2">
                    {selectedLinks.length > 0 && (
                        <Button variant="outline" size="sm" onClick={() => {
                            toast({
                                title: 'Bulk action',
                                description: `${selectedLinks.length} links selected`,
                            });
                            setSelectedLinks([]);
                        }}>
                            <CheckSquare className="mr-2 h-4 w-4" />
                            {selectedLinks.length} selected
                        </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={fetchPaymentLinks} disabled={loading}>
                        <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
                        Refresh
                    </Button>
                    <Button onClick={() => setView('create')}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Payment Link
                    </Button>
                </div>
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
                                    <TableHead className="w-12">
                                        <Checkbox
                                            checked={selectedLinks.length === filteredLinks.length && filteredLinks.length > 0}
                                            onCheckedChange={(checked) => {
                                                setSelectedLinks(checked ? filteredLinks.map(l => l.id) : []);
                                            }}
                                        />
                                    </TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Clicks / Paid</TableHead>
                                    <TableHead>Conversion</TableHead>
                                    <TableHead className="text-right">Amount Received</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLinks.map((link) => {
                                    const conversionRate = link.clicks > 0 ? ((link.paid / link.clicks) * 100).toFixed(1) : '0.0';
                                    const isSelected = selectedLinks.includes(link.id);
                                    return (
                                        <TableRow key={link.id} className={isSelected ? 'bg-muted/50' : ''}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={(checked) => {
                                                        setSelectedLinks(checked
                                                            ? [...selectedLinks, link.id]
                                                            : selectedLinks.filter(id => id !== link.id)
                                                        );
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{link.title}</div>
                                                <div className="text-xs text-muted-foreground font-mono">
                                                    {link.id.substring(0, 8)}...
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusVariant(link.status)}>
                                                    {link.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span>{link.clicks}</span>
                                                    <span className="text-muted-foreground">/</span>
                                                    <span className="font-medium text-green-600">{link.paid}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <TrendingUp className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-sm font-medium">{conversionRate}%</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {formatCurrency(link.amountReceived, link.currency)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Calendar className="h-3 w-3" />
                                                    {link.created ? formatDate(link.created) : 'N/A'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        {link.publicUrl && (
                                                            <>
                                                                <DropdownMenuItem onClick={() => copyToClipboard(link.publicUrl!)}>
                                                                    <Copy className="mr-2 h-4 w-4" />
                                                                    Copy Link
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => window.open(link.publicUrl, '_blank')}>
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    View Link
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/payment-links/${link.id}`}>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
                {!loading && filteredLinks.length > 0 && (
                    <CardFooter>
                        <div className="flex items-center justify-between w-full">
                            <div className="text-xs text-muted-foreground">
                                Showing <strong>1-{filteredLinks.length}</strong> of <strong>{links.length}</strong> payment links
                            </div>
                            <Button variant="outline" size="sm" onClick={() => {
                                const csvContent = [
                                    ['ID', 'Title', 'Status', 'Clicks', 'Paid', 'Conversion Rate', 'Amount Received', 'Currency', 'Created'].join(','),
                                    ...filteredLinks.map(link => [
                                        link.id,
                                        `"${link.title}"`,
                                        link.status,
                                        link.clicks,
                                        link.paid,
                                        link.clicks > 0 ? ((link.paid / link.clicks) * 100).toFixed(2) : '0',
                                        link.amountReceived,
                                        link.currency,
                                        link.created ? formatDate(link.created) : 'N/A',
                                    ].join(','))
                                ].join('\n');
                                const blob = new Blob([csvContent], { type: 'text/csv' });
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `payment-links-${new Date().toISOString().split('T')[0]}.csv`;
                                a.click();
                                window.URL.revokeObjectURL(url);
                                toast({ title: 'Exported', description: 'Payment links exported to CSV' });
                            }}>
                                <Download className="mr-2 h-4 w-4" />
                                Export CSV
                            </Button>
                        </div>
                    </CardFooter>
                )}
            </Card>
        </>
    );
}
