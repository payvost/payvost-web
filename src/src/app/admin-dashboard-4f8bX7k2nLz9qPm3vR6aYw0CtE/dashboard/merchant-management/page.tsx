
'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Search, Store, ShieldAlert, BadgeInfo, Users, CircleDollarSign } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { MerchantAccountData } from '@/types/merchant';
import { cn } from '@/lib/utils';

const sampleMerchants: MerchantAccountData[] = [
    { id: 'merch_1', name: 'Creatify Studio', status: 'Active', balance: 15230.50, currency: 'USD', payoutSchedule: 'Daily', onboardedDate: '2024-08-01', complianceStatus: 'Verified', platformFee: 1.5, transactions: [] },
    { id: 'merch_2', name: 'Gourmet Goods', status: 'Restricted', balance: 250.00, currency: 'USD', payoutSchedule: 'Weekly', onboardedDate: '2024-07-15', complianceStatus: 'Pending', platformFee: 2.0, transactions: [] },
    { id: 'merch_3', name: 'Digital Nomads Inc.', status: 'Active', balance: 8900.00, currency: 'USD', payoutSchedule: 'Daily', onboardedDate: '2024-06-20', complianceStatus: 'Verified', platformFee: 1.5, transactions: [] },
    { id: 'merch_4', name: 'The Art Corner', status: 'Payouts Held', balance: 5400.75, currency: 'USD', payoutSchedule: 'Monthly', onboardedDate: '2024-05-10', complianceStatus: 'Needs Review', platformFee: 2.5, transactions: [] },
    { id: 'merch_5', name: 'Tech Gadgets Online', status: 'Active', balance: 112050.00, currency: 'USD', payoutSchedule: 'Daily', onboardedDate: '2024-08-05', complianceStatus: 'Verified', platformFee: 1.0, transactions: [] },
];

const statusConfig = {
    Active: { variant: 'default' as const, className: 'bg-green-500/20 text-green-700' },
    Restricted: { variant: 'destructive' as const, className: 'bg-orange-500/20 text-orange-700' },
    'Payouts Held': { variant: 'destructive' as const, className: 'bg-yellow-500/20 text-yellow-700' },
};


export default function MerchantManagementPage() {
    const router = useRouter();

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Merchant Management</h2>
                    <p className="text-muted-foreground">Oversee all connected merchant accounts.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline">Export List</Button>
                    <Button onClick={() => {}}><PlusCircle className="mr-2 h-4 w-4" />Onboard New Merchant</Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Merchants</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">2,350</div>
                        <p className="text-xs text-muted-foreground">+180 from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                        <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$4,850,123.50</div>
                        <p className="text-xs text-muted-foreground">Across all merchant accounts</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Funds on Hold</CardTitle>
                        <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$5,400.75</div>
                        <p className="text-xs text-muted-foreground">From 1 account with payouts held</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search by merchant name or ID..."
                            className="w-full rounded-lg bg-background pl-8 md:w-[320px]"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Merchant</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Payout Schedule</TableHead>
                                <TableHead className="text-right">Balance</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sampleMerchants.map((merchant) => {
                                const config = statusConfig[merchant.status as keyof typeof statusConfig] || { variant: 'secondary', className: '' };
                                return (
                                <TableRow key={merchant.id} onClick={() => router.push(`/admin-panel/dashboard/merchant-management/${merchant.id}`)} className="cursor-pointer">
                                    <TableCell>
                                        <div className="font-medium">{merchant.name}</div>
                                        <div className="text-sm text-muted-foreground">ID: {merchant.id}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={config.variant} className={cn('capitalize', config.className)}>{merchant.status}</Badge>
                                    </TableCell>
                                     <TableCell>
                                        <Badge variant="outline">{merchant.payoutSchedule}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: merchant.currency }).format(merchant.balance)}
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
                                                <DropdownMenuItem>View Dashboard</DropdownMenuItem>
                                                <DropdownMenuItem>Hold Payouts</DropdownMenuItem>
                                                <DropdownMenuItem>Edit Settings</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">Suspend Merchant</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    );
}
