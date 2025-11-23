

'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Search, Users, UserPlus, ShieldAlert } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import type { CustomerData, UserType } from '@/types/customer';
import type { KycStatus } from '@/types/kyc';
import { normalizeKycStatus } from '@/types/kyc';
import { cn } from '@/lib/utils';
import { ListFilter } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import axios from 'axios';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


const kycStatusConfig: Record<KycStatus, { color: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    verified: { color: 'text-green-700 dark:text-green-300', variant: 'default' },
    pending: { color: 'text-yellow-700 dark:text-yellow-300', variant: 'secondary' },
    unverified: { color: 'text-gray-700 dark:text-gray-300', variant: 'outline' },
    restricted: { color: 'text-orange-700 dark:text-orange-300', variant: 'destructive' },
    rejected: { color: 'text-red-700 dark:text-red-300', variant: 'destructive' },
};

export default function CustomersPage() {
    const router = useRouter();
    const [customers, setCustomers] = useState<CustomerData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const response = await axios.get('/api/admin/customers');
                setCustomers(response.data);
            } catch (error) {
                console.error("Error fetching customers:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCustomers();
    }, []);


    // Generate avatar initials as a fallback
    const getInitials = (name?: string, email?: string) => {
        if (name && name.trim().length > 0) {
            const parts = name.trim().split(/\s+/);
            const first = parts[0]?.[0] ?? '';
            const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
            return (first + last).toUpperCase() || 'U';
        }
        if (email && email.includes('@')) {
            const handle = email.split('@')[0];
            return handle.slice(0, 2).toUpperCase();
        }
        return 'U';
    }


    const getRiskBadge = (score: number) => {
        if (score > 75) return <Badge variant="destructive">High</Badge>;
        if (score > 40) return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 dark:bg-yellow-500/30">Medium</Badge>;
        return <Badge variant="default" className="bg-green-500/20 text-green-700 dark:text-green-300 dark:bg-green-500/30">Low</Badge>;
    }

    // Calculate new signups in the last 30 days
    const getNewSignups = () => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        return customers.filter(customer => {
            const dateField = customer.joinedDate || customer.createdAt;
            if (!dateField) return false;
            
            let joinDate: Date;
            if (typeof dateField === 'string') {
                joinDate = new Date(dateField);
            } else if (dateField.toDate) {
                joinDate = dateField.toDate();
            } else if ((dateField as any)._seconds) {
                joinDate = new Date((dateField as any)._seconds * 1000);
            } else if (dateField instanceof Date) {
                joinDate = dateField;
            } else {
                return false;
            }
            
            return joinDate >= thirtyDaysAgo;
        }).length;
    };

    // Calculate KYC pending users
    const getKycPending = () => {
        return customers.filter(customer => {
            const kycStatus = typeof customer.kycStatus === 'string' ? customer.kycStatus.toLowerCase() : '';
            
            // Check for various pending statuses
            const pendingStatuses = [
                'pending',
                'tier1_pending_review',
                'in_review',
                'submitted',
                'pending_review'
            ];
            
            if (pendingStatuses.includes(kycStatus)) {
                return true;
            }
            
            // Check kycProfile for tier statuses
            if (customer.kycProfile?.tiers) {
                const tiers = customer.kycProfile.tiers;
                // Check if any tier has pending/submitted status
                if (tiers.tier1?.status === 'submitted' || tiers.tier1?.status === 'pending_review') {
                    return true;
                }
                if (tiers.tier2?.status === 'submitted' || tiers.tier2?.status === 'pending_review' || tiers.tier2?.status === 'in_review') {
                    return true;
                }
                if (tiers.tier3?.status === 'submitted' || tiers.tier3?.status === 'pending_review' || tiers.tier3?.status === 'in_review') {
                    return true;
                }
            }
            
            // Check userType for pending users
            if (customer.userType === 'Pending') {
                return true;
            }
            
            return false;
        }).length;
    };

    // Calculate users from last month (30-60 days ago)
    const getUsersFromLastMonth = () => {
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        
        return customers.filter(customer => {
            const dateField = customer.joinedDate || customer.createdAt;
            if (!dateField) return false;
            
            let joinDate: Date;
            if (typeof dateField === 'string') {
                joinDate = new Date(dateField);
            } else if (dateField.toDate) {
                joinDate = dateField.toDate();
            } else if ((dateField as any)._seconds) {
                joinDate = new Date((dateField as any)._seconds * 1000);
            } else if (dateField instanceof Date) {
                joinDate = dateField;
            } else {
                return false;
            }
            
            return joinDate >= sixtyDaysAgo && joinDate < thirtyDaysAgo;
        }).length;
    };

    // Calculate change from last month
    const getMonthOverMonthChange = () => {
        const lastMonthCount = getUsersFromLastMonth();
        const currentMonthCount = getNewSignups();
        const change = currentMonthCount - lastMonthCount;
        
        if (change === 0) return 'No change from last month';
        if (change > 0) return `+${change.toLocaleString()} from last month`;
        return `${change.toLocaleString()} from last month`;
    };


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
                        <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-20" /> : customers.length}</div>
                        <p className="text-xs text-muted-foreground">{loading ? <Skeleton className="h-4 w-32" /> : getMonthOverMonthChange()}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">New Signups (30d)</CardTitle>
                        <UserPlus className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-20" /> : getNewSignups()}</div>
                        <p className="text-xs text-muted-foreground">In the last 30 days</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">KYC Pending</CardTitle>
                        <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-10" /> : getKycPending()}</div>
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
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                                    </TableRow>
                                ))
                            ) : (
                            customers.map((user) => {
                                const normalizedStatus = normalizeKycStatus(user.kycStatus);
                                const status = kycStatusConfig[normalizedStatus];
                                const statusLabel = normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);
                                const riskScore = user.riskScore || Math.floor(Math.random() * 100);
                                const userType = user.userType || 'Pending';

                                return (
                                <TableRow key={user.id} onClick={() => router.push(`/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/customers/${user.id}`)} className="cursor-pointer">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={user.photoURL || ''} alt={user.name} />
                                                <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium">{user.name}</div>
                                                <div className="text-sm text-muted-foreground">{user.email}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{userType}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge 
                                            variant={status.variant} 
                                            className={cn(
                                                'capitalize',
                                                status.color,
                                                status.color.includes('green') ? 'bg-green-500/20 dark:bg-green-500/30' :
                                                status.color.includes('yellow') ? 'bg-yellow-500/20 dark:bg-yellow-500/30' :
                                                status.color.includes('orange') ? 'bg-orange-500/20 dark:bg-orange-500/30' :
                                                status.color.includes('red') ? 'bg-red-500/20 dark:bg-red-500/30' :
                                                status.color.includes('gray') ? 'bg-gray-500/20 dark:bg-gray-500/30' : ''
                                            )}
                                        >
                                            {statusLabel}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {getRiskBadge(riskScore)}
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
                            )})
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    );
}
