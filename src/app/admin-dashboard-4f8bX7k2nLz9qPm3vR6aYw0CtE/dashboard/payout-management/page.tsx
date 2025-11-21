'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { RefreshCw, Plus, Search, MoreHorizontal, Clock, CheckCircle, AlertCircle, Calendar, DollarSign, TrendingUp, Download, Eye, PlayCircle, PauseCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar } from 'recharts';

interface Payout {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  amount: number;
  currency: string;
  method: string;
  status: 'Pending' | 'Scheduled' | 'Processing' | 'Completed' | 'Failed';
  description?: string;
  createdAt: string;
  scheduledAt?: string;
  completedAt?: string;
  failureReason?: string;
}

interface PayoutSummary {
  totalProcessed: number;
  pendingAmount: number;
  failedCount: number;
  scheduledCount: number;
  totalCount: number;
}

const statusVariant: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  Completed: 'default',
  Processing: 'secondary',
  Pending: 'outline',
  Scheduled: 'secondary',
  Failed: 'destructive',
};

export default function PayoutManagementPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [filteredPayouts, setFilteredPayouts] = useState<Payout[]>([]);
  const [summary, setSummary] = useState<PayoutSummary>({
    totalProcessed: 0,
    pendingAmount: 0,
    failedCount: 0,
    scheduledCount: 0,
    totalCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPayout, setNewPayout] = useState({
    userId: '',
    amount: '',
    currency: 'USD',
    method: 'Bank Transfer',
    description: '',
    scheduledAt: '',
  });
  const { toast } = useToast();

  const fetchPayouts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (dateRange?.from) {
        params.append('startDate', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        params.append('endDate', dateRange.to.toISOString());
      }

      const response = await axios.get(`/api/admin/financial/payouts?${params.toString()}`);
      const data = response.data;
      const payoutsData = data.payouts || [];
      setPayouts(payoutsData);
      setSummary({
        totalProcessed: data.summary?.totalProcessed || 0,
        pendingAmount: data.summary?.pendingAmount || 0,
        failedCount: data.summary?.failedCount || 0,
        scheduledCount: data.summary?.scheduledCount || 0,
        totalCount: data.summary?.totalCount || payoutsData.length,
      });
    } catch (error: any) {
      console.error('Error fetching payouts:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch payouts. Using sample data.',
        variant: 'destructive',
      });
      
      // Fallback sample data
      const samplePayouts: Payout[] = [
        {
          id: 'payout_1',
          userId: 'user_123',
          userName: 'John Doe',
          userEmail: 'john@example.com',
          amount: 5000,
          currency: 'USD',
          method: 'Bank Transfer',
          status: 'Completed',
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        },
        {
          id: 'payout_2',
          userId: 'user_456',
          userName: 'Jane Smith',
          userEmail: 'jane@example.com',
          amount: 2500,
          currency: 'USD',
          method: 'Mobile Money',
          status: 'Pending',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'payout_3',
          userId: 'user_789',
          userName: 'Bob Johnson',
          userEmail: 'bob@example.com',
          amount: 10000,
          currency: 'USD',
          method: 'Bank Transfer',
          status: 'Scheduled',
          createdAt: new Date().toISOString(),
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        },
        {
          id: 'payout_4',
          userId: 'user_321',
          userName: 'Alice Brown',
          userEmail: 'alice@example.com',
          amount: 750,
          currency: 'USD',
          method: 'Card Payout',
          status: 'Failed',
          createdAt: new Date().toISOString(),
          failureReason: 'Insufficient funds',
        },
      ];
      
      setPayouts(samplePayouts);
      setSummary({
        totalProcessed: 5000,
        pendingAmount: 2500,
        failedCount: 1,
        scheduledCount: 1,
        totalCount: 4,
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, dateRange, toast]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  useEffect(() => {
    if (!payouts || payouts.length === 0) {
      setFilteredPayouts([]);
      return;
    }

    let filtered = [...payouts];

    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.method.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredPayouts(filtered);
  }, [payouts, searchQuery]);

  const handleCreatePayout = async () => {
    if (!newPayout.userId || !newPayout.amount) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      await axios.post('/api/admin/financial/payouts', {
        ...newPayout,
        amount: parseFloat(newPayout.amount),
        scheduledAt: newPayout.scheduledAt || undefined,
      });

      toast({
        title: 'Success',
        description: 'Payout created successfully',
      });

      setCreateDialogOpen(false);
      setNewPayout({
        userId: '',
        amount: '',
        currency: 'USD',
        method: 'Bank Transfer',
        description: '',
        scheduledAt: '',
      });
      fetchPayouts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to create payout',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateStatus = async (payoutId: string, newStatus: string) => {
    try {
      await axios.put('/api/admin/financial/payouts', {
        id: payoutId,
        status: newStatus,
      });

      toast({
        title: 'Success',
        description: 'Payout status updated',
      });

      fetchPayouts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update payout status',
        variant: 'destructive',
      });
    }
  };

  const chartData = React.useMemo(() => {
    if (!payouts || payouts.length === 0) {
      // Return empty data structure for chart
      return Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: format(date, 'MMM dd'),
          amount: 0,
          count: 0,
        };
      });
    }

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: format(date, 'MMM dd'),
        amount: payouts
          .filter((p) => {
            if (!p.createdAt) return false;
            const pDate = new Date(p.createdAt);
            return pDate.toDateString() === date.toDateString() && p.status === 'Completed';
          })
          .reduce((sum, p) => sum + (p.amount || 0), 0),
        count: payouts.filter((p) => {
          if (!p.createdAt) return false;
          const pDate = new Date(p.createdAt);
          return pDate.toDateString() === date.toDateString() && p.status === 'Completed';
        }).length,
      };
    });
    return last7Days;
  }, [payouts]);

  const renderPayoutsTable = (data: Payout[]) => {
    if (loading) {
      return (
        <div className="space-y-2 p-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="p-8 text-center text-muted-foreground">
          <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No payouts found</p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Payout ID</TableHead>
            <TableHead>Recipient</TableHead>
            <TableHead>Method</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead><span className="sr-only">Actions</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((payout) => (
            <TableRow key={payout.id}>
              <TableCell>
                <div className="font-medium">{payout.id}</div>
              </TableCell>
              <TableCell>
                <div className="font-medium">{payout.userName || 'Unknown'}</div>
                <div className="text-xs text-muted-foreground">{payout.userEmail}</div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{payout.method}</Badge>
              </TableCell>
              <TableCell className="text-right font-mono">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: payout.currency }).format(payout.amount)}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant[payout.status]}>{payout.status}</Badge>
                {payout.status === 'Failed' && payout.failureReason && (
                  <p className="text-xs text-destructive mt-1">{payout.failureReason}</p>
                )}
                {payout.status === 'Scheduled' && payout.scheduledAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(payout.scheduledAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(payout.createdAt), 'MMM dd, yyyy HH:mm')}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setSelectedPayout(payout); setDetailsOpen(true); }}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    {payout.status === 'Pending' && (
                      <DropdownMenuItem onClick={() => handleUpdateStatus(payout.id, 'Processing')}>
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Process Now
                      </DropdownMenuItem>
                    )}
                    {payout.status === 'Scheduled' && (
                      <DropdownMenuItem onClick={() => handleUpdateStatus(payout.id, 'Pending')}>
                        <Clock className="mr-2 h-4 w-4" />
                        Execute Now
                      </DropdownMenuItem>
                    )}
                    {payout.status === 'Failed' && (
                      <DropdownMenuItem onClick={() => handleUpdateStatus(payout.id, 'Pending')}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Retry
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => {}}>
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <>
      <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Payout Management</h2>
          <p className="text-muted-foreground">Manage and monitor all payouts to users and merchants.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={fetchPayouts}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Payout
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Payout</DialogTitle>
                <DialogDescription>Create a new payout for a user or merchant.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>User ID</Label>
                  <Input
                    value={newPayout.userId}
                    onChange={(e) => setNewPayout({ ...newPayout, userId: e.target.value })}
                    placeholder="user_123"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newPayout.amount}
                      onChange={(e) => setNewPayout({ ...newPayout, amount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select value={newPayout.currency} onValueChange={(v) => setNewPayout({ ...newPayout, currency: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="NGN">NGN</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Method</Label>
                  <Select value={newPayout.method} onValueChange={(v) => setNewPayout({ ...newPayout, method: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                      <SelectItem value="Card Payout">Card Payout</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description (Optional)</Label>
                  <Input
                    value={newPayout.description}
                    onChange={(e) => setNewPayout({ ...newPayout, description: e.target.value })}
                    placeholder="Payout description"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Schedule For (Optional)</Label>
                  <Input
                    type="datetime-local"
                    value={newPayout.scheduledAt}
                    onChange={(e) => setNewPayout({ ...newPayout, scheduledAt: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePayout}>Create Payout</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Processed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(summary.totalProcessed)}
                </div>
                <p className="text-xs text-muted-foreground">completed payouts</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(summary.pendingAmount)}
                </div>
                <p className="text-xs text-muted-foreground">awaiting processing</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{summary.scheduledCount}</div>
                <p className="text-xs text-muted-foreground">scheduled payouts</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{summary.failedCount}</div>
                <p className="text-xs text-muted-foreground">failed attempts</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Payout Volume (Last 7 Days)</CardTitle>
          <CardDescription>Completed payout amounts and counts</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === 'amount') {
                      return [new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value), 'Amount'];
                    }
                    return [value, 'Count'];
                  }}
                />
                <Bar yAxisId="left" dataKey="amount" fill="#8884d8" name="Amount" />
                <Line yAxisId="right" type="monotone" dataKey="count" stroke="#82ca9d" strokeWidth={2} name="Count" />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="all" onValueChange={setStatusFilter}>
        <div className="flex items-center justify-between gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="Pending">Pending</TabsTrigger>
            <TabsTrigger value="Scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="Processing">Processing</TabsTrigger>
            <TabsTrigger value="Failed">Failed</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search payouts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
              />
            </div>
            <DateRangePicker date={dateRange} onDateChange={setDateRange} />
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <TabsContent value="all" className="m-0">
              {renderPayoutsTable(filteredPayouts)}
            </TabsContent>
            <TabsContent value="Pending" className="m-0">
              {renderPayoutsTable(filteredPayouts.filter((p) => p.status === 'Pending'))}
            </TabsContent>
            <TabsContent value="Scheduled" className="m-0">
              {renderPayoutsTable(filteredPayouts.filter((p) => p.status === 'Scheduled'))}
            </TabsContent>
            <TabsContent value="Processing" className="m-0">
              {renderPayoutsTable(filteredPayouts.filter((p) => p.status === 'Processing'))}
            </TabsContent>
            <TabsContent value="Failed" className="m-0">
              {renderPayoutsTable(filteredPayouts.filter((p) => p.status === 'Failed'))}
            </TabsContent>
          </CardContent>
          <CardFooter>
            <div className="text-xs text-muted-foreground">
              {loading ? (
                'Loading...'
              ) : filteredPayouts.length === 0 ? (
                'No payouts found'
              ) : (
                <>
                  Showing <strong>1-{filteredPayouts.length}</strong> of <strong>{payouts.length}</strong> payouts
                </>
              )}
            </div>
          </CardFooter>
        </Card>
      </Tabs>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payout Details</DialogTitle>
            <DialogDescription>Detailed information about payout {selectedPayout?.id}</DialogDescription>
          </DialogHeader>
          {selectedPayout && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payout ID</p>
                  <p className="text-sm">{selectedPayout.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">User</p>
                  <p className="text-sm">{selectedPayout.userName || selectedPayout.userId}</p>
                  <p className="text-xs text-muted-foreground">{selectedPayout.userEmail}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Amount</p>
                  <p className="text-sm font-mono">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: selectedPayout.currency }).format(selectedPayout.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Method</p>
                  <p className="text-sm">{selectedPayout.method}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant={statusVariant[selectedPayout.status]}>{selectedPayout.status}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created At</p>
                  <p className="text-sm">{format(new Date(selectedPayout.createdAt), 'PPpp')}</p>
                </div>
                {selectedPayout.scheduledAt && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Scheduled For</p>
                    <p className="text-sm">{format(new Date(selectedPayout.scheduledAt), 'PPpp')}</p>
                  </div>
                )}
                {selectedPayout.completedAt && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Completed At</p>
                    <p className="text-sm">{format(new Date(selectedPayout.completedAt), 'PPpp')}</p>
                  </div>
                )}
                {selectedPayout.failureReason && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Failure Reason</p>
                    <p className="text-sm text-destructive">{selectedPayout.failureReason}</p>
                  </div>
                )}
                {selectedPayout.description && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Description</p>
                    <p className="text-sm">{selectedPayout.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              Close
            </Button>
            {selectedPayout?.status === 'Failed' && (
              <Button onClick={() => { handleUpdateStatus(selectedPayout.id, 'Pending'); setDetailsOpen(false); }}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry Payout
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

