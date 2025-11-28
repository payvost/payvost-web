'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Mail, Phone, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';

export default function BusinessCustomersPage() {
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [customers, setCustomers] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!user && !authLoading) {
            setLoading(false);
            return;
        }

        const fetchCustomers = async () => {
            try {
                setLoading(true);
                // TODO: Replace with actual API endpoint when available
                // const response = await fetch('/api/business/customers');
                // const data = await response.json();
                // setCustomers(data.customers || []);
                
                // Placeholder data
                setCustomers([]);
            } catch (err) {
                console.error('Error fetching customers:', err);
                setCustomers([]);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchCustomers();
        }
    }, [user, authLoading]);

    const filteredCustomers = Array.isArray(customers) 
        ? customers.filter(customer => {
            if (!customer) return false;
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (
                    customer?.name?.toLowerCase().includes(query) ||
                    customer?.email?.toLowerCase().includes(query) ||
                    customer?.phone?.toLowerCase().includes(query)
                );
            }
            return true;
        })
        : [];

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
                    <p className="text-muted-foreground">Manage your customer relationships and view their activity.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Customer
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <CardTitle>All Customers</CardTitle>
                            <CardDescription>View and manage your customer database.</CardDescription>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search customers..."
                                className="pl-8 w-full md:w-[300px]"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full" />
                            ))}
                        </div>
                    ) : filteredCustomers.length === 0 ? (
                        <div className="text-center py-12">
                            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No customers yet</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Start by adding your first customer or they will appear here after making a purchase.
                            </p>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Customer
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Total Spent</TableHead>
                                    <TableHead>Last Purchase</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(filteredCustomers || []).map((customer) => (
                                    <TableRow key={customer?.id || Math.random()}>
                                        <TableCell className="font-medium">{customer?.name || 'N/A'}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                {customer?.email || 'N/A'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                {customer?.phone || 'N/A'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {new Intl.NumberFormat('en-US', {
                                                style: 'currency',
                                                currency: customer?.currency || 'USD',
                                            }).format(customer?.totalSpent || 0)}
                                        </TableCell>
                                        <TableCell>
                                            {customer?.lastPurchase
                                                ? new Date(customer.lastPurchase).toLocaleDateString()
                                                : 'Never'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={customer?.status === 'active' ? 'default' : 'secondary'}>
                                                {customer?.status || 'active'}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </>
    );
}

