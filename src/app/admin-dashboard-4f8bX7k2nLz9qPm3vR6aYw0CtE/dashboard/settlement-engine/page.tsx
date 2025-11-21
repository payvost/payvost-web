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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileDown, MoreHorizontal, Search, CheckCircle, Clock, AlertTriangle, RefreshCw, Layers3, AlertCircle, TrendingUp, Download, Eye, PlayCircle, PauseCircle } from 'lucide-react';
import type { Settlement } from '@/types/settlement';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const statusVariant: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  Completed: 'default',
  'In Progress': 'secondary',
  Pending: 'outline',
  Failed: 'destructive',
};

interface SettlementSummary {
  totalSettled: number;
  pendingAmount: number;
  failedCount: number;
  totalCount: number;
}

export default function SettlementEnginePage() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [filteredSettlements, setFilteredSettlements] = useState<Settlement[]>([]);
  const [summary, setSummary] = useState<SettlementSummary>({
    totalSettled: 0,
    pendingAmount: 0,
    failedCount: 0,
    totalCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { toast } = useToast();

  const fetchSettlements = useCallback(async () => {
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

      const response = await axios.get(`/api/admin/financial/settlements?${params.toString()}`);
      const data = response.data;
      setSettlements(data.settlements || []);
      setSummary(data.summary || summary);
    } catch (error: any) {
      console.error('Error fetching settlements:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch settlements. Using sample data.',
        variant: 'destructive',
      });
      // Fallback to sample data
      const sampleSettlements: Settlement[] = [
        { id: 'set_1a2b', batchId: 'batch_001', destination: 'Creatify Studio (Stripe)', amount: 15230.50, currency: 'USD', status: 'Completed', createdAt: new Date().toISOString(), completedAt: new Date().toISOString() },
        { id: 'set_1a2c', batchId: 'batch_002', destination: 'Gourmet Goods (Bank)', amount: 250.00, currency: 'USD', status: 'In Progress', createdAt: new Date().toISOString() },
        { id: 'set_1a2d', batchId: 'batch_002', destination: 'Digital Nomads Inc. (Wise)', amount: 8900.00, currency: 'USD', status: 'Pending', createdAt: new Date().toISOString() },
        { id: 'set_1a2e', batchId: 'batch_003', destination: 'The Art Corner (Bank)', amount: 5400.75, currency: 'USD', status: 'Failed', createdAt: new Date().toISOString(), reason: 'Invalid account number' },
        { id: 'set_1a2f', batchId: 'batch_004', destination: 'Tech Gadgets Online (Stripe)', amount: 112050.00, currency: 'USD', status: 'Pending', createdAt: new Date().toISOString() },
      ];
      setSettlements(sampleSettlements);
      setSummary({
        totalSettled: 15230.50,
        pendingAmount: 120950.00,
        failedCount: 1,
        totalCount: 5,
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, dateRange, toast, summary]);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  useEffect(() => {
    let filtered = settlements;

    if (searchQuery) {
      filtered = filtered.filter(
        (s) =>
          s.batchId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredSettlements(filtered);
  }, [settlements, searchQuery]);

  const handleRetry = async (settlement: Settlement) => {
    try {
      toast({
        title: 'Retrying Settlement',
        description: `Retrying settlement ${settlement.id}...`,
      });
      // TODO: Implement retry logic
      await fetchSettlements();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to retry settlement',
        variant: 'destructive',
      });
    }
  };

  const handleExport = () => {
    toast({
      title: 'Exporting Data',
      description: 'Preparing settlement data for export...',
    });
    // TODO: Implement export logic
  };

  const chartData = React.useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: format(date, 'MMM dd'),
        amount: settlements
          .filter((s) => {
            const sDate = new Date(s.createdAt);
            return sDate.toDateString() === date.toDateString() && s.status === 'Completed';
          })
          .reduce((sum, s) => sum + s.amount, 0),
      };
    });
    return last7Days;
  }, [settlements]);

  const renderSettlementsTable = (data: Settlement[]) => {
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
          <Layers3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No settlements found</p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Batch / Settlement ID</TableHead>
            <TableHead>Destination</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead><span className="sr-only">Actions</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="font-medium">{item.batchId}</div>
                <div className="text-xs text-muted-foreground">{item.id}</div>
              </TableCell>
              <TableCell>{item.destination}</TableCell>
              <TableCell className="text-right font-mono">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: item.currency }).format(item.amount)}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant[item.status]}>{item.status}</Badge>
                {item.status === 'Failed' && item.reason && (
                  <p className="text-xs text-destructive mt-1">{item.reason}</p>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(item.createdAt), 'MMM dd, yyyy HH:mm')}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setSelectedSettlement(item); setDetailsOpen(true); }}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    {item.status === 'Failed' && (
                      <DropdownMenuItem onClick={() => handleRetry(item)}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Retry Settlement
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleExport}>
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
          <h2 className="text-3xl font-bold tracking-tight">Settlement & Reconciliation</h2>
          <p className="text-muted-foreground">Monitor and manage payouts to users and merchants.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={fetchSettlements}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button>
            <PlayCircle className="mr-2 h-4 w-4" />
            Initiate Batch
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Settled (24h)</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(summary.totalSettled)}
                </div>
                <p className="text-xs text-muted-foreground">from {summary.totalCount} settlements</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <Layers3 className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">Failed Attempts</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{summary.failedCount}</div>
                <p className="text-xs text-muted-foreground">check retry queue for details</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {summary.totalCount > 0
                    ? `${((summary.totalCount - summary.failedCount) / summary.totalCount * 100).toFixed(1)}%`
                    : '0%'}
                </div>
                <p className="text-xs text-muted-foreground">settlement success rate</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Settlement Volume (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)} />
              <Bar dataKey="amount" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" onValueChange={setStatusFilter}>
        <div className="flex items-center justify-between gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="Pending">Pending</TabsTrigger>
            <TabsTrigger value="In Progress">In Progress</TabsTrigger>
            <TabsTrigger value="Failed">Retry Queue</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by batch or destination..."
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
              {renderSettlementsTable(filteredSettlements)}
            </TabsContent>
            <TabsContent value="Pending" className="m-0">
              {renderSettlementsTable(filteredSettlements.filter((s) => s.status === 'Pending'))}
            </TabsContent>
            <TabsContent value="In Progress" className="m-0">
              {renderSettlementsTable(filteredSettlements.filter((s) => s.status === 'In Progress'))}
            </TabsContent>
            <TabsContent value="Failed" className="m-0">
              {renderSettlementsTable(filteredSettlements.filter((s) => s.status === 'Failed'))}
            </TabsContent>
          </CardContent>
          <CardFooter>
            <div className="text-xs text-muted-foreground">
              Showing <strong>1-{filteredSettlements.length}</strong> of <strong>{settlements.length}</strong> settlements
            </div>
          </CardFooter>
        </Card>
      </Tabs>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settlement Details</DialogTitle>
            <DialogDescription>
              Detailed information about settlement {selectedSettlement?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedSettlement && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Settlement ID</p>
                  <p className="text-sm">{selectedSettlement.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Batch ID</p>
                  <p className="text-sm">{selectedSettlement.batchId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Destination</p>
                  <p className="text-sm">{selectedSettlement.destination}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Amount</p>
                  <p className="text-sm font-mono">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: selectedSettlement.currency }).format(selectedSettlement.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant={statusVariant[selectedSettlement.status]}>{selectedSettlement.status}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created At</p>
                  <p className="text-sm">{format(new Date(selectedSettlement.createdAt), 'PPpp')}</p>
                </div>
                {selectedSettlement.completedAt && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Completed At</p>
                    <p className="text-sm">{format(new Date(selectedSettlement.completedAt), 'PPpp')}</p>
                  </div>
                )}
                {selectedSettlement.reason && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Failure Reason</p>
                    <p className="text-sm text-destructive">{selectedSettlement.reason}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>Close</Button>
            {selectedSettlement?.status === 'Failed' && (
              <Button onClick={() => { handleRetry(selectedSettlement); setDetailsOpen(false); }}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry Settlement
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
