
'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Search, Store, ShieldAlert, BadgeInfo, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { BusinessAccountData, BusinessVerificationStatus } from '@/types/business-account';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import axios from 'axios';

const statusConfig: Record<BusinessVerificationStatus, { color: string, variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    verified: { color: 'text-green-600', variant: 'default' },
    pending: { color: 'text-yellow-600', variant: 'secondary' },
    rejected: { color: 'text-red-600', variant: 'destructive' },
    restricted: { color: 'text-orange-600', variant: 'destructive' },
};

export default function BusinessAccountsPage() {
    const router = useRouter();
    const [businesses, setBusinesses] = useState<BusinessAccountData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch business accounts
    useEffect(() => {
        const fetchBusinessAccounts = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await axios.get('/api/admin/business-accounts');
                setBusinesses(response.data || []);
            } catch (err: any) {
                console.error('Error fetching business accounts:', err);
                setError(err.response?.data?.error || 'Failed to load business accounts');
                setBusinesses([]);
            } finally {
                setLoading(false);
            }
        };

        fetchBusinessAccounts();
    }, []);

    // Filter businesses based on search query
    const filteredBusinesses = useMemo(() => {
        if (!searchQuery.trim()) {
            return businesses;
        }
        const query = searchQuery.toLowerCase();
        return businesses.filter(
            (biz) =>
                biz.businessName.toLowerCase().includes(query) ||
                biz.owner.name.toLowerCase().includes(query) ||
                biz.sector.toLowerCase().includes(query)
        );
    }, [businesses, searchQuery]);

    // Calculate stats
    const stats = useMemo(() => {
        const total = businesses.length;
        const pending = businesses.filter((b) => b.verificationStatus === 'pending').length;
        const highRisk = businesses.filter((b) => b.verificationStatus === 'restricted' || b.disputeRatio > 0.05).length;
        
        // Calculate growth from last month (simplified - would need historical data)
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const thisMonth = businesses.filter((b) => {
            const onboardingDate = new Date(b.onboardingDate);
            return onboardingDate >= lastMonth;
        }).length;
        
        return { total, pending, highRisk, thisMonth };
    }, [businesses]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-muted-foreground">Loading business accounts...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Error Loading Business Accounts</CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => window.location.reload()}>Retry</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Business Accounts</h2>
                    <p className="text-muted-foreground">Manage and monitor all registered businesses.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline">Configure Tiers</Button>
                    <Button onClick={() => {}}><PlusCircle className="mr-2 h-4 w-4" />Onboard New Business</Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Businesses</CardTitle>
                        <Store className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.thisMonth > 0 ? `+${stats.thisMonth} from last month` : 'No new businesses this month'}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
                        <BadgeInfo className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pending}</div>
                        <p className="text-xs text-muted-foreground">Awaiting document review</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">High-Risk Accounts</CardTitle>
                        <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.highRisk}</div>
                        <p className="text-xs text-muted-foreground">Flagged for unusual activity</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search by business name or owner..."
                            className="w-full rounded-lg bg-background pl-8 md:w-[320px]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredBusinesses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Store className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">
                                {searchQuery ? 'No businesses found' : 'No business accounts yet'}
                            </h3>
                            <p className="text-sm text-muted-foreground max-w-sm">
                                {searchQuery
                                    ? 'Try adjusting your search query to find what you\'re looking for.'
                                    : 'Business accounts will appear here once businesses complete onboarding.'}
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Business</TableHead>
                                    <TableHead>Owner</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>KYC Tier</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredBusinesses.map((biz) => {
                                    const status = statusConfig[biz.verificationStatus];
                                    return (
                                    <TableRow key={biz.id} onClick={() => router.push(`/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/business-accounts/${biz.id}`)} className="cursor-pointer">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <img src={`/flag/${biz.countryCode}.png`} alt={biz.country} className="h-4 w-6 object-cover rounded-sm" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                                <div>
                                                    <div className="font-medium">{biz.businessName}</div>
                                                    <div className="text-sm text-muted-foreground">{biz.sector}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Link href={`/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/customers/${biz.owner.id}`} className="hover:underline text-primary" onClick={(e) => e.stopPropagation()}>{biz.owner.name}</Link>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={status.variant} className={cn('capitalize', status.color.replace('text-','bg-').replace('-600','-500/20'))}>{biz.verificationStatus}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{biz.kycTier}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button aria-haspopup="true" size="icon" variant="ghost" onClick={(e) => e.stopPropagation()}>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Toggle menu</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem>View Details</DropdownMenuItem>
                                                    <DropdownMenuItem>Suspend Account</DropdownMenuItem>
                                                    <DropdownMenuItem>Upgrade KYC</DropdownMenuItem>
                                                    <DropdownMenuItem>Request Documents</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )})}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </>
    );
}
