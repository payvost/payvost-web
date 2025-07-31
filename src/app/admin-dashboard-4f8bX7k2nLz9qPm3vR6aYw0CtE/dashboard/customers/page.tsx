'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Search, Users, UserPlus, ShieldAlert } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import type { CustomerData, KycStatus, UserType } from '@/types/customer';
import { cn } from '@/lib/utils';
import { ListFilter } from 'lucide-react';


import { useEffect, useState } from 'react';


const kycStatusConfig: Record<KycStatus, { color: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    Verified: { color: 'text-green-700', variant: 'default' },
    Pending: { color: 'text-yellow-700', variant: 'secondary' },
    Unverified: { color: 'text-gray-700', variant: 'outline' },
    Restricted: { color: 'text-orange-700', variant: 'destructive' },
};

export default function CustomersPage() {
    const router = useRouter();
    const [customers, setCustomers] = useState<CustomerData[]>([]);

    useEffect(() => {
      async function fetchCustomers() {
        try {
          const res = await fetch('http://localhost:3001/user');
          const data = await res.json();
          setCustomers(data.customers || []);
        } catch (err) {
          setCustomers([]);
        }
      }
      fetchCustomers();
    }, []);

    const getRiskBadge = (score: number) => {
        if (score > 75) return <Badge variant="destructive">High</Badge>;
        if (score > 40) return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700">Medium</Badge>;
        return <Badge variant="default" className="bg-green-500/20 text-green-700">Low</Badge>;
    }

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
                    <p className="text-muted-foreground">Manage and monitor all platform users.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button onClick={() => {}}><PlusCircle className="mr-2 h-4 w-4" />Create Customer</Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12,482</div>
                        <p className="text-xs text-muted-foreground">+2,130 from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">New Signups (30d)</CardTitle>
                        <UserPlus className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">2,130</div>
                        <p className="text-xs text-muted-foreground">Across all categories</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">KYC Pending</CardTitle>
                        <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">84</div>
                        <p className="text-xs text-muted-foreground">Awaiting document review</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                     <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search by name, email, or user ID..."
                                className="w-full rounded-lg bg-background pl-8"
                            />
                        </div>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-10 gap-1">
                                <ListFilter className="h-3.5 w-3.5" />
                                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Filter</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Filter by User Type</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuCheckboxItem checked>Normal User</DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem>Business Owner</DropdownMenuCheckboxItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>User Type</TableHead>
                                <TableHead>KYC Status</TableHead>
                                <TableHead>Risk</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {customers.map((user) => {
                                const status = kycStatusConfig[user.kycStatus as KycStatus] || kycStatusConfig['Unverified'];
                                return (
                                <TableRow key={user.id} onClick={() => router.push(`/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/customers/${user.id}`)} className="cursor-pointer">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <img src={`/flags/${user.countryCode || 'US'}.png`} alt={user.country || 'Unknown'} className="h-4 w-6 object-cover rounded-sm"/>
                                            <div>
                                                <div className="font-medium">{user.name}</div>
                                                <div className="text-sm text-muted-foreground">{user.email}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{user.userType}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={status.variant} className={cn('capitalize', status.color, status.color.replace('text-','bg-').replace('-700','-500/20'))}>{user.kycStatus}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {getRiskBadge(user.riskScore)}
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
                                                <DropdownMenuItem>Suspend User</DropdownMenuItem>
                                                <DropdownMenuItem>View Transactions</DropdownMenuItem>
                                                <DropdownMenuItem>Reset Password</DropdownMenuItem>
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
