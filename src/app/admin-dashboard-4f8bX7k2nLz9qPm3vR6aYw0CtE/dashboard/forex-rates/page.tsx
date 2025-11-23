'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Globe, Percent, SlidersHorizontal, RefreshCw, PlusCircle, Edit, PauseCircle, PlayCircle, MoreHorizontal, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import type { ForexRate } from '@/types/forex-rate';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const statusConfig = {
  Active: 'bg-green-500/20 text-green-700 dark:text-green-300 dark:bg-green-500/30',
  Paused: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 dark:bg-yellow-500/30',
};

interface ForexSummary {
  totalPairs: number;
  activePairs: number;
  pausedPairs: number;
  averageMarkup: string;
}

export default function ForexRatesPage() {
  const { toast } = useToast();
  const [rates, setRates] = useState<ForexRate[]>([]);
  const [summary, setSummary] = useState<ForexSummary>({
    totalPairs: 0,
    activePairs: 0,
    pausedPairs: 0,
    averageMarkup: '0.00',
  });
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRate, setSelectedRate] = useState<ForexRate | null>(null);
  const [editCurrencyPair, setEditCurrencyPair] = useState('');
  const [editBaseRate, setEditBaseRate] = useState('');
  const [editMarkup, setEditMarkup] = useState('');
  const [editStatus, setEditStatus] = useState<'Active' | 'Paused'>('Active');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchRates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/financial/forex-rates');
      const data = response.data;
      setRates(data.rates || []);
      setSummary(data.summary || {
        totalPairs: 0,
        activePairs: 0,
        pausedPairs: 0,
        averageMarkup: '0.00',
      });
    } catch (error: any) {
      console.error('Error fetching forex rates:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch forex rates. Using sample data.',
        variant: 'destructive',
      });
      
      // Fallback sample data
      const staticDate = new Date().toISOString();
      const sampleRates: ForexRate[] = [
        { id: 'rate_1', currencyPair: 'USD/NGN', baseRate: 1450.50, markup: 0.75, customerRate: 1461.38, status: 'Active', lastUpdated: staticDate },
        { id: 'rate_2', currencyPair: 'GBP/GHS', baseRate: 15.30, markup: 1.00, customerRate: 15.45, status: 'Active', lastUpdated: staticDate },
        { id: 'rate_3', currencyPair: 'EUR/KES', baseRate: 133.00, markup: 0.80, customerRate: 134.06, status: 'Paused', lastUpdated: new Date(new Date(staticDate).getTime() - 3600 * 1000).toISOString() },
        { id: 'rate_4', currencyPair: 'USD/GBP', baseRate: 0.79, markup: 0.50, customerRate: 0.794, status: 'Active', lastUpdated: staticDate },
        { id: 'rate_5', currencyPair: 'USD/EUR', baseRate: 0.92, markup: 0.50, customerRate: 0.925, status: 'Active', lastUpdated: staticDate },
      ];
      setRates(sampleRates);
      setSummary({
        totalPairs: 5,
        activePairs: 4,
        pausedPairs: 1,
        averageMarkup: '0.71',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchRates();
      }, 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchRates]);

  const handleRefreshRates = () => {
    toast({
      title: 'Refreshing Rates...',
      description: 'Fetching the latest rates from our providers.',
    });
    fetchRates();
  };

  const handleEditRate = (rate: ForexRate) => {
    setSelectedRate(rate);
    setEditCurrencyPair(rate.currencyPair);
    setEditBaseRate(rate.baseRate.toString());
    setEditMarkup(rate.markup.toString());
    setEditStatus(rate.status);
    setEditDialogOpen(true);
  };

  const handleSaveRate = async () => {
    if (!editCurrencyPair || !editBaseRate || !editMarkup) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const baseRateNum = parseFloat(editBaseRate);
    const markupNum = parseFloat(editMarkup);

    if (isNaN(baseRateNum) || isNaN(markupNum)) {
      toast({
        title: 'Error',
        description: 'Please enter valid numbers',
        variant: 'destructive',
      });
      return;
    }

    try {
      await axios.post('/api/admin/financial/forex-rates', {
        currencyPair: editCurrencyPair,
        baseRate: baseRateNum,
        markup: markupNum,
        status: editStatus,
      });

      toast({
        title: 'Success',
        description: 'Forex rate updated successfully',
      });

      setEditDialogOpen(false);
      fetchRates();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update forex rate',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = async (rate: ForexRate) => {
    try {
      await axios.post('/api/admin/financial/forex-rates', {
        currencyPair: rate.currencyPair,
        baseRate: rate.baseRate,
        markup: rate.markup,
        status: rate.status === 'Active' ? 'Paused' : 'Active',
      });

      toast({
        title: 'Success',
        description: `Rate ${rate.status === 'Active' ? 'paused' : 'activated'}`,
      });

      fetchRates();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to toggle rate status',
        variant: 'destructive',
      });
    }
  };

  const rateHistoryData = React.useMemo(() => {
    if (rates.length === 0) return [];
    
    // Create a combined history for the first 3 rates
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateStr = format(date, 'MMM dd');
      
      const dataPoint: any = { date: dateStr };
      
      // Add data for first 3 rates
      rates.slice(0, 3).forEach((rate, idx) => {
        const variation = (Math.random() - 0.5) * 0.02;
        dataPoint[`${rate.currencyPair}_base`] = rate.baseRate * (1 + variation);
        dataPoint[`${rate.currencyPair}_customer`] = rate.customerRate * (1 + variation);
      });
      
      return dataPoint;
    });
    
    return last7Days;
  }, [rates]);

  return (
    <>
      <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Foreign Exchange Rate Management</h2>
          <p className="text-muted-foreground">Monitor and manage FX rates, markups, and providers.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? (
              <>
                <PauseCircle className="mr-2 h-4 w-4" />
                Auto-Refresh On
              </>
            ) : (
              <>
                <PlayCircle className="mr-2 h-4 w-4" />
                Auto-Refresh Off
              </>
            )}
          </Button>
          <Button variant="outline">
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Provider Rules
          </Button>
          <Button onClick={handleRefreshRates}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh All Rates
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monitored Pairs</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{summary.totalPairs}</div>
                <p className="text-xs text-muted-foreground">Actively tracked currency pairs</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Markup</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{summary.averageMarkup}%</div>
                <p className="text-xs text-muted-foreground">Platform-wide average profit margin</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paused Rates</CardTitle>
            <PauseCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{summary.pausedPairs}</div>
                <p className="text-xs text-muted-foreground">Pairs with manual rate locks</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {rateHistoryData.length > 0 && rates.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Rate Trends (Last 7 Days)</CardTitle>
            <CardDescription>Base rate vs customer rate trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={rateHistoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                {rates.slice(0, 3).map((rate, idx) => {
                  const colors = ['#8884d8', '#82ca9d', '#ffc658'];
                  return (
                    <React.Fragment key={rate.id}>
                      <Line
                        type="monotone"
                        dataKey={`${rate.currencyPair}_base`}
                        stroke={colors[idx]}
                        strokeDasharray="5 5"
                        name={`${rate.currencyPair} (Base)`}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey={`${rate.currencyPair}_customer`}
                        stroke={colors[idx]}
                        name={`${rate.currencyPair} (Customer)`}
                        dot={false}
                      />
                    </React.Fragment>
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Live FX Rates</CardTitle>
              <CardDescription>Current exchange rates with markups</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : rates.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No rates configured</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Currency Pair</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Base Rate</TableHead>
                      <TableHead className="text-right">Markup (%)</TableHead>
                      <TableHead className="text-right">Customer Rate</TableHead>
                      <TableHead><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rates.map((rate) => (
                      <TableRow key={rate.id}>
                        <TableCell>
                          <div className="font-medium">{rate.currencyPair}</div>
                          <div className="text-xs text-muted-foreground">
                            Last updated: {format(new Date(rate.lastUpdated), 'MMM dd, yyyy HH:mm')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(statusConfig[rate.status])}>
                            {rate.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">{rate.baseRate.toFixed(4)}</TableCell>
                        <TableCell className="text-right font-mono">{rate.markup.toFixed(2)}%</TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {rate.customerRate.toFixed(4)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditRate(rate)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Adjust Markup
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleStatus(rate)}>
                                {rate.status === 'Active' ? (
                                  <>
                                    <PauseCircle className="mr-2 h-4 w-4" />
                                    Pause Auto-Update
                                  </>
                                ) : (
                                  <>
                                    <PlayCircle className="mr-2 h-4 w-4" />
                                    Resume Auto-Update
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem>View History</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Adjust Rates</CardTitle>
              <CardDescription>Add or update a currency pair's markup.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currency-pair">Currency Pair</Label>
                <Input
                  id="currency-pair"
                  placeholder="e.g., USD/CAD"
                  value={editCurrencyPair}
                  onChange={(e) => setEditCurrencyPair(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="base-rate">Base Rate</Label>
                <Input
                  id="base-rate"
                  type="number"
                  step="0.0001"
                  placeholder="e.g., 1.2500"
                  value={editBaseRate}
                  onChange={(e) => setEditBaseRate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="markup">Markup (%)</Label>
                <Input
                  id="markup"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 0.85"
                  value={editMarkup}
                  onChange={(e) => setEditMarkup(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as 'Active' | 'Paused')}
                >
                  <option value="Active">Active</option>
                  <option value="Paused">Paused</option>
                </select>
              </div>
              {editBaseRate && editMarkup && !isNaN(parseFloat(editBaseRate)) && !isNaN(parseFloat(editMarkup)) && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-xs text-muted-foreground mb-1">Customer Rate:</p>
                  <p className="text-lg font-semibold">
                    {(parseFloat(editBaseRate) * (1 + parseFloat(editMarkup) / 100)).toFixed(4)}
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleSaveRate}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Save or Add Rule
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Forex Rate</DialogTitle>
            <DialogDescription>Update the markup and status for {selectedRate?.currencyPair}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Base Rate</Label>
              <Input
                type="number"
                step="0.0001"
                value={editBaseRate}
                onChange={(e) => setEditBaseRate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Markup (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={editMarkup}
                onChange={(e) => setEditMarkup(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as 'Active' | 'Paused')}
              >
                <option value="Active">Active</option>
                <option value="Paused">Paused</option>
              </select>
            </div>
            {editBaseRate && editMarkup && !isNaN(parseFloat(editBaseRate)) && !isNaN(parseFloat(editMarkup)) && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-xs text-muted-foreground mb-1">New Customer Rate:</p>
                <p className="text-lg font-semibold">
                  {(parseFloat(editBaseRate) * (1 + parseFloat(editMarkup) / 100)).toFixed(4)}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
