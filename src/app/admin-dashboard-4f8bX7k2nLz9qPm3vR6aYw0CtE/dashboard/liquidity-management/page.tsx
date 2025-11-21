'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Banknote, TrendingUp, TrendingDown, ArrowUpDown, Plus, RefreshCw, AlertCircle, CheckCircle, DollarSign, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface LiquidityAccount {
  id: string;
  name: string;
  currency: string;
  balance: number;
  reserved: number;
  available: number;
  status: 'active' | 'frozen' | 'closed';
  provider?: string;
  accountNumber?: string;
}

interface LiquidityMovement {
  id: string;
  accountId: string;
  accountName?: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'transfer';
  description: string;
  status: string;
  createdAt: string;
}

interface LiquiditySummary {
  totalBalance: number;
  totalReserved: number;
  availableBalance: number;
  accountCount: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function LiquidityManagementPage() {
  const [accounts, setAccounts] = useState<LiquidityAccount[]>([]);
  const [movements, setMovements] = useState<LiquidityMovement[]>([]);
  const [summary, setSummary] = useState<LiquiditySummary>({
    totalBalance: 0,
    totalReserved: 0,
    availableBalance: 0,
    accountCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [currencyFilter, setCurrencyFilter] = useState('ALL');
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  const [movementType, setMovementType] = useState<'deposit' | 'withdrawal' | 'transfer'>('deposit');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementAccount, setMovementAccount] = useState('');
  const [movementDescription, setMovementDescription] = useState('');
  const { toast } = useToast();

  const fetchLiquidityData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (currencyFilter !== 'ALL') {
        params.append('currency', currencyFilter);
      }

      const response = await axios.get(`/api/admin/financial/liquidity?${params.toString()}`);
      const data = response.data;
      
      // Process accounts
      const processedAccounts = (data.accounts || []).map((acc: any) => ({
        ...acc,
        balance: parseFloat(acc.balance || 0),
        reserved: parseFloat(acc.reserved || 0),
        available: parseFloat(acc.balance || 0) - parseFloat(acc.reserved || 0),
      }));
      
      setAccounts(processedAccounts);
      setMovements(data.movements || []);
      setSummary(data.summary || summary);
    } catch (error: any) {
      console.error('Error fetching liquidity data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch liquidity data. Using sample data.',
        variant: 'destructive',
      });
      
      // Fallback sample data
      const sampleAccounts: LiquidityAccount[] = [
        {
          id: 'acc_1',
          name: 'Primary USD Account',
          currency: 'USD',
          balance: 2500000,
          reserved: 500000,
          available: 2000000,
          status: 'active',
          provider: 'Chase Bank',
          accountNumber: '****1234',
        },
        {
          id: 'acc_2',
          name: 'NGN Settlement Account',
          currency: 'NGN',
          balance: 500000000,
          reserved: 100000000,
          available: 400000000,
          status: 'active',
          provider: 'GTBank',
          accountNumber: '****5678',
        },
        {
          id: 'acc_3',
          name: 'GBP Reserve Account',
          currency: 'GBP',
          balance: 150000,
          reserved: 30000,
          available: 120000,
          status: 'active',
          provider: 'Barclays',
          accountNumber: '****9012',
        },
      ];
      
      setAccounts(sampleAccounts);
      setSummary({
        totalBalance: 2650000,
        totalReserved: 530000,
        availableBalance: 2120000,
        accountCount: 3,
      });
    } finally {
      setLoading(false);
    }
  }, [currencyFilter, toast, summary]);

  useEffect(() => {
    fetchLiquidityData();
  }, [fetchLiquidityData]);

  const handleMovement = async () => {
    if (!movementAccount || !movementAmount || !movementDescription) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      await axios.post('/api/admin/financial/liquidity', {
        accountId: movementAccount,
        amount: parseFloat(movementAmount),
        type: movementType,
        description: movementDescription,
      });

      toast({
        title: 'Success',
        description: 'Liquidity movement recorded successfully',
      });

      setMovementDialogOpen(false);
      setMovementAmount('');
      setMovementDescription('');
      fetchLiquidityData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to record movement',
        variant: 'destructive',
      });
    }
  };

  const chartData = React.useMemo(() => {
    return accounts.map((acc) => ({
      name: `${acc.currency} - ${acc.name}`,
      value: acc.available,
      currency: acc.currency,
    }));
  }, [accounts]);

  const movementChartData = React.useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dayMovements = movements.filter((m) => {
        const mDate = new Date(m.createdAt);
        return mDate.toDateString() === date.toDateString();
      });
      
      return {
        date: format(date, 'MMM dd'),
        deposits: dayMovements
          .filter((m) => m.type === 'deposit')
          .reduce((sum, m) => sum + Math.abs(m.amount), 0),
        withdrawals: dayMovements
          .filter((m) => m.type === 'withdrawal')
          .reduce((sum, m) => sum + Math.abs(m.amount), 0),
      };
    });
    return last7Days;
  }, [movements]);

  return (
    <>
      <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Liquidity Management</h2>
          <p className="text-muted-foreground">Monitor and manage platform liquidity across all accounts.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={fetchLiquidityData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Dialog open={movementDialogOpen} onOpenChange={setMovementDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Record Movement
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Liquidity Movement</DialogTitle>
                <DialogDescription>
                  Record a deposit, withdrawal, or transfer to track liquidity changes.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Movement Type</Label>
                  <Select value={movementType} onValueChange={(v: any) => setMovementType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deposit">Deposit</SelectItem>
                      <SelectItem value="withdrawal">Withdrawal</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Account</Label>
                  <Select value={movementAccount} onValueChange={setMovementAccount}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name} ({acc.currency})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={movementAmount}
                    onChange={(e) => setMovementAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={movementDescription}
                    onChange={(e) => setMovementDescription(e.target.value)}
                    placeholder="Movement description"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setMovementDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleMovement}>Record Movement</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(summary.totalBalance)}
                </div>
                <p className="text-xs text-muted-foreground">across {summary.accountCount} accounts</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(summary.availableBalance)}
                </div>
                <p className="text-xs text-muted-foreground">available for operations</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reserved Funds</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(summary.totalReserved)}
                </div>
                <p className="text-xs text-muted-foreground">locked for pending transactions</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {summary.totalBalance > 0
                    ? `${((summary.totalReserved / summary.totalBalance) * 100).toFixed(1)}%`
                    : '0%'}
                </div>
                <p className="text-xs text-muted-foreground">of total balance reserved</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Balance Distribution</CardTitle>
            <CardDescription>Available balance by account</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name.split(' - ')[0]} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Movement Trends (Last 7 Days)</CardTitle>
            <CardDescription>Deposits vs withdrawals</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={movementChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)} />
                  <Line type="monotone" dataKey="deposits" stroke="#00C49F" strokeWidth={2} name="Deposits" />
                  <Line type="monotone" dataKey="withdrawals" stroke="#FF8042" strokeWidth={2} name="Withdrawals" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="accounts">
        <TabsList className="mb-4">
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="movements">Recent Movements</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Liquidity Accounts</CardTitle>
                  <CardDescription>Manage and monitor all liquidity accounts</CardDescription>
                </div>
                <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Currencies</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="NGN">NGN</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : accounts.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Banknote className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No accounts found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account Name</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead className="text-right">Total Balance</TableHead>
                      <TableHead className="text-right">Reserved</TableHead>
                      <TableHead className="text-right">Available</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell>
                          <div className="font-medium">{account.name}</div>
                          {account.provider && (
                            <div className="text-xs text-muted-foreground">{account.provider}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{account.currency}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: account.currency }).format(account.balance)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: account.currency }).format(account.reserved)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: account.currency }).format(account.available)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              account.status === 'active'
                                ? 'default'
                                : account.status === 'frozen'
                                ? 'secondary'
                                : 'destructive'
                            }
                          >
                            {account.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements">
          <Card>
            <CardHeader>
              <CardTitle>Recent Movements</CardTitle>
              <CardDescription>Latest liquidity movements and transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : movements.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No movements found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.slice(0, 20).map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell className="text-sm">
                          {format(new Date(movement.createdAt), 'MMM dd, yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              movement.type === 'deposit'
                                ? 'default'
                                : movement.type === 'withdrawal'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {movement.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{movement.accountName || movement.accountId}</TableCell>
                        <TableCell className="text-right font-mono">
                          <span className={movement.type === 'deposit' ? 'text-green-600' : 'text-red-600'}>
                            {movement.type === 'deposit' ? '+' : '-'}
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Math.abs(movement.amount))}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{movement.description}</TableCell>
                        <TableCell>
                          <Badge variant={movement.status === 'completed' ? 'default' : 'secondary'}>
                            {movement.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

