'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PlusCircle, Trash2, Edit, Percent, FileText, DollarSign, RefreshCw, AlertCircle } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const transactionFeeRuleSchema = z.object({
  region: z.string().min(1, 'Region is required'),
  type: z.string().min(1, 'Type is required'),
  feeType: z.enum(['fixed', 'percentage', 'combo']),
  fixedRate: z.number().optional(),
  percentageRate: z.number().optional(),
});

type TransactionFeeRuleFormValues = z.infer<typeof transactionFeeRuleSchema>;

const payoutFeeRuleSchema = z.object({
  method: z.string().min(1, 'Method is required'),
  country: z.string().min(1, 'Country is required'),
  feeType: z.enum(['fixed', 'percentage', 'combo']),
  fixedRate: z.number().optional(),
  percentageRate: z.number().optional(),
});

type PayoutFeeRuleFormValues = z.infer<typeof payoutFeeRuleSchema>;

const fxMarkupRuleSchema = z.object({
  currencyPair: z.string().min(1, 'Currency pair is required'),
  markupPercentage: z.number().min(0, 'Markup must be a non-negative number'),
});

type FxMarkupRuleFormValues = z.infer<typeof fxMarkupRuleSchema>;

interface FeeRule {
  id: string;
  type: 'transaction' | 'payout' | 'fx';
  region?: string;
  method?: string;
  country?: string;
  currencyPair?: string;
  transactionType?: string;
  feeType: 'fixed' | 'percentage' | 'combo';
  fixedRate?: number;
  percentageRate?: number;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function FeeConfigurationPage() {
  const { toast } = useToast();
  const [transactionRules, setTransactionRules] = useState<FeeRule[]>([]);
  const [payoutRules, setPayoutRules] = useState<FeeRule[]>([]);
  const [fxMarkupRules, setFxMarkupRules] = useState<FeeRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<FeeRule | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<FeeRule | null>(null);

  const transactionForm = useForm<TransactionFeeRuleFormValues>({
    resolver: zodResolver(transactionFeeRuleSchema),
    defaultValues: { region: 'Global', type: 'P2P Transfer', feeType: 'percentage' },
  });

  const payoutForm = useForm<PayoutFeeRuleFormValues>({
    resolver: zodResolver(payoutFeeRuleSchema),
    defaultValues: { method: 'Bank Transfer', country: 'Global', feeType: 'fixed' },
  });

  const fxMarkupForm = useForm<FxMarkupRuleFormValues>({
    resolver: zodResolver(fxMarkupRuleSchema),
    defaultValues: { currencyPair: 'USD/EUR', markupPercentage: 0.5 },
  });

  const fetchFeeRules = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/financial/fees');
      const data = response.data;

      setTransactionRules(data.grouped?.transaction || []);
      setPayoutRules(data.grouped?.payout || []);
      setFxMarkupRules(data.grouped?.fx || []);
    } catch (error: any) {
      console.error('Error fetching fee rules:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch fee rules. Using sample data.',
        variant: 'destructive',
      });

      // Fallback sample data
      setTransactionRules([
        { id: 'rule_1', type: 'transaction', region: 'USA -> NGA', transactionType: 'P2P Transfer', feeType: 'combo', percentageRate: 1.5, fixedRate: 2.0 },
        { id: 'rule_2', type: 'transaction', region: 'Global', transactionType: 'Bill Payment', feeType: 'percentage', percentageRate: 0.5 },
        { id: 'rule_3', type: 'transaction', region: 'GBR -> GHA', transactionType: 'P2P Transfer', feeType: 'fixed', fixedRate: 1.5 },
      ]);
      setPayoutRules([
        { id: 'payout_1', type: 'payout', method: 'Bank Transfer (NGN)', country: 'Nigeria', feeType: 'fixed', fixedRate: 50 },
        { id: 'payout_2', type: 'payout', method: 'Mobile Money (GHS)', country: 'Ghana', feeType: 'percentage', percentageRate: 1.0 },
        { id: 'payout_3', type: 'payout', method: 'Card Payout (USD)', country: 'Global', feeType: 'combo', percentageRate: 0.5, fixedRate: 0.3 },
      ]);
      setFxMarkupRules([
        { id: 'fx_1', type: 'fx', currencyPair: 'USD/NGN', feeType: 'percentage', percentageRate: 0.75 },
        { id: 'fx_2', type: 'fx', currencyPair: 'GBP/GHS', feeType: 'percentage', percentageRate: 1.0 },
        { id: 'fx_3', type: 'fx', currencyPair: 'EUR/KES', feeType: 'percentage', percentageRate: 0.8 },
      ]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchFeeRules();
  }, [fetchFeeRules]);

  const formatFee = (rule: FeeRule) => {
    if (rule.feeType === 'fixed') {
      return `$${rule.fixedRate?.toFixed(2) || '0.00'}`;
    } else if (rule.feeType === 'percentage') {
      return `${rule.percentageRate?.toFixed(2) || '0.00'}%`;
    } else {
      return `${rule.percentageRate?.toFixed(2) || '0.00'}% + $${rule.fixedRate?.toFixed(2) || '0.00'}`;
    }
  };

  const onTransactionSubmit = async (data: TransactionFeeRuleFormValues) => {
    try {
      const ruleData = {
        type: 'transaction',
        region: data.region,
        transactionType: data.type,
        feeType: data.feeType,
        fixedRate: data.fixedRate,
        percentageRate: data.percentageRate,
      };

      if (editingRule) {
        await axios.put('/api/admin/financial/fees', { id: editingRule.id, ...ruleData });
        toast({ title: 'Success', description: 'Transaction fee rule updated successfully' });
      } else {
        await axios.post('/api/admin/financial/fees', ruleData);
        toast({ title: 'Success', description: 'Transaction fee rule added successfully' });
      }

      transactionForm.reset();
      setEditDialogOpen(false);
      setEditingRule(null);
      fetchFeeRules();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to save fee rule',
        variant: 'destructive',
      });
    }
  };

  const onPayoutSubmit = async (data: PayoutFeeRuleFormValues) => {
    try {
      const ruleData = {
        type: 'payout',
        method: data.method,
        country: data.country,
        feeType: data.feeType,
        fixedRate: data.fixedRate,
        percentageRate: data.percentageRate,
      };

      if (editingRule) {
        await axios.put('/api/admin/financial/fees', { id: editingRule.id, ...ruleData });
        toast({ title: 'Success', description: 'Payout fee rule updated successfully' });
      } else {
        await axios.post('/api/admin/financial/fees', ruleData);
        toast({ title: 'Success', description: 'Payout fee rule added successfully' });
      }

      payoutForm.reset();
      setEditDialogOpen(false);
      setEditingRule(null);
      fetchFeeRules();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to save fee rule',
        variant: 'destructive',
      });
    }
  };

  const onFxMarkupSubmit = async (data: FxMarkupRuleFormValues) => {
    try {
      const ruleData = {
        type: 'fx',
        currencyPair: data.currencyPair,
        feeType: 'percentage',
        percentageRate: data.markupPercentage,
      };

      if (editingRule) {
        await axios.put('/api/admin/financial/fees', { id: editingRule.id, ...ruleData });
        toast({ title: 'Success', description: 'FX markup rule updated successfully' });
      } else {
        await axios.post('/api/admin/financial/fees', ruleData);
        toast({ title: 'Success', description: 'FX markup rule added successfully' });
      }

      fxMarkupForm.reset();
      setEditDialogOpen(false);
      setEditingRule(null);
      fetchFeeRules();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to save fee rule',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!ruleToDelete) return;

    try {
      await axios.delete(`/api/admin/financial/fees?id=${ruleToDelete.id}`);
      toast({ title: 'Success', description: 'Fee rule deleted successfully' });
      setDeleteDialogOpen(false);
      setRuleToDelete(null);
      fetchFeeRules();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete fee rule',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (rule: FeeRule) => {
    setEditingRule(rule);
    if (rule.type === 'transaction') {
      transactionForm.reset({
        region: rule.region || 'Global',
        type: rule.transactionType || 'P2P Transfer',
        feeType: rule.feeType,
        fixedRate: rule.fixedRate,
        percentageRate: rule.percentageRate,
      });
    } else if (rule.type === 'payout') {
      payoutForm.reset({
        method: rule.method || 'Bank Transfer',
        country: rule.country || 'Global',
        feeType: rule.feeType,
        fixedRate: rule.fixedRate,
        percentageRate: rule.percentageRate,
      });
    } else {
      fxMarkupForm.reset({
        currencyPair: rule.currencyPair || 'USD/EUR',
        markupPercentage: rule.percentageRate || 0.5,
      });
    }
    setEditDialogOpen(true);
  };

  return (
    <>
      <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Fee Configuration</h2>
          <p className="text-muted-foreground">Manage and set fee structures for your platform.</p>
        </div>
        <Button variant="outline" onClick={fetchFeeRules}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="transaction-fees">
        <TabsList>
          <TabsTrigger value="transaction-fees">
            <DollarSign className="mr-2 h-4 w-4" />
            Transaction Fees
          </TabsTrigger>
          <TabsTrigger value="payout-fees">
            <FileText className="mr-2 h-4 w-4" />
            Payout Fees
          </TabsTrigger>
          <TabsTrigger value="fx-markups">
            <Percent className="mr-2 h-4 w-4" />
            FX Markups
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transaction-fees" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Transaction Fee Rules</CardTitle>
                  <CardDescription>Active fee structures based on various conditions.</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : transactionRules.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No transaction fee rules configured</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Region/Corridor</TableHead>
                          <TableHead>Transaction Type</TableHead>
                          <TableHead>Fee</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactionRules.map((rule) => (
                          <TableRow key={rule.id}>
                            <TableCell className="font-medium">{rule.region}</TableCell>
                            <TableCell>{rule.transactionType}</TableCell>
                            <TableCell className="font-mono">{formatFee(rule)}</TableCell>
                            <TableCell>
                              <Badge variant={rule.active !== false ? 'default' : 'secondary'}>
                                {rule.active !== false ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(rule)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => {
                                  setRuleToDelete(rule);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
                <form onSubmit={transactionForm.handleSubmit(onTransactionSubmit)}>
                  <CardHeader>
                    <CardTitle>{editingRule ? 'Edit' : 'Create New'} Transaction Rule</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="region">Region/Corridor</Label>
                      <Controller
                        name="region"
                        control={transactionForm.control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Global">Global</SelectItem>
                              <SelectItem value="USA -> NGA">USA → Nigeria</SelectItem>
                              <SelectItem value="GBR -> GHA">UK → Ghana</SelectItem>
                              <SelectItem value="EUR -> KES">Europe → Kenya</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Transaction Type</Label>
                      <Controller
                        name="type"
                        control={transactionForm.control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="P2P Transfer">P2P Transfer</SelectItem>
                              <SelectItem value="Bill Payment">Bill Payment</SelectItem>
                              <SelectItem value="Card Funding">Card Funding</SelectItem>
                              <SelectItem value="Merchant Payment">Merchant Payment</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="feeType">Fee Type</Label>
                      <Controller
                        name="feeType"
                        control={transactionForm.control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fixed">Fixed Rate</SelectItem>
                              <SelectItem value="percentage">Percentage</SelectItem>
                              <SelectItem value="combo">Fixed + Percentage</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="percentageRate">Percentage (%)</Label>
                        <Input
                          id="percentageRate"
                          type="number"
                          step="0.01"
                          {...transactionForm.register('percentageRate', { valueAsNumber: true })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fixedRate">Fixed Rate ($)</Label>
                        <Input
                          id="fixedRate"
                          type="number"
                          step="0.01"
                          {...transactionForm.register('fixedRate', { valueAsNumber: true })}
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      {editingRule ? 'Update Rule' : 'Add Rule'}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="payout-fees" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Payout Fee Rules</CardTitle>
                  <CardDescription>Configure fees for different payout methods.</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : payoutRules.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No payout fee rules configured</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Payout Method</TableHead>
                          <TableHead>Country</TableHead>
                          <TableHead>Fee</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payoutRules.map((rule) => (
                          <TableRow key={rule.id}>
                            <TableCell className="font-medium">{rule.method}</TableCell>
                            <TableCell>{rule.country}</TableCell>
                            <TableCell className="font-mono">{formatFee(rule)}</TableCell>
                            <TableCell>
                              <Badge variant={rule.active !== false ? 'default' : 'secondary'}>
                                {rule.active !== false ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(rule)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => {
                                  setRuleToDelete(rule);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
                <form onSubmit={payoutForm.handleSubmit(onPayoutSubmit)}>
                  <CardHeader>
                    <CardTitle>{editingRule ? 'Edit' : 'Create New'} Payout Rule</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="payout-method">Payout Method</Label>
                      <Controller
                        name="method"
                        control={payoutForm.control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger id="payout-method">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                              <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                              <SelectItem value="Card Payout">Card Payout</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payout-country">Country</Label>
                      <Controller
                        name="country"
                        control={payoutForm.control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger id="payout-country">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Global">Global</SelectItem>
                              <SelectItem value="Nigeria">Nigeria</SelectItem>
                              <SelectItem value="Ghana">Ghana</SelectItem>
                              <SelectItem value="Kenya">Kenya</SelectItem>
                              <SelectItem value="USA">USA</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payout-feeType">Fee Type</Label>
                      <Controller
                        name="feeType"
                        control={payoutForm.control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fixed">Fixed Rate</SelectItem>
                              <SelectItem value="percentage">Percentage</SelectItem>
                              <SelectItem value="combo">Fixed + Percentage</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="payout-percentageRate">Percentage (%)</Label>
                        <Input
                          id="payout-percentageRate"
                          type="number"
                          step="0.01"
                          {...payoutForm.register('percentageRate', { valueAsNumber: true })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="payout-fixedRate">Fixed Rate ($)</Label>
                        <Input
                          id="payout-fixedRate"
                          type="number"
                          step="0.01"
                          {...payoutForm.register('fixedRate', { valueAsNumber: true })}
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      {editingRule ? 'Update Rule' : 'Add Payout Rule'}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="fx-markups" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Foreign Exchange Markups</CardTitle>
                  <CardDescription>Set markups on top of the base exchange rate for currency pairs.</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : fxMarkupRules.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Percent className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No FX markup rules configured</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Currency Pair</TableHead>
                          <TableHead>Markup</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fxMarkupRules.map((rule) => (
                          <TableRow key={rule.id}>
                            <TableCell className="font-medium">{rule.currencyPair}</TableCell>
                            <TableCell className="font-mono">{formatFee(rule)}</TableCell>
                            <TableCell>
                              <Badge variant={rule.active !== false ? 'default' : 'secondary'}>
                                {rule.active !== false ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(rule)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => {
                                  setRuleToDelete(rule);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
                <form onSubmit={fxMarkupForm.handleSubmit(onFxMarkupSubmit)}>
                  <CardHeader>
                    <CardTitle>{editingRule ? 'Edit' : 'Add New'} FX Markup</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currencyPair">Currency Pair</Label>
                      <Controller
                        name="currencyPair"
                        control={fxMarkupForm.control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger id="currencyPair">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USD/NGN">USD / NGN</SelectItem>
                              <SelectItem value="GBP/GHS">GBP / GHS</SelectItem>
                              <SelectItem value="EUR/KES">EUR / KES</SelectItem>
                              <SelectItem value="USD/EUR">USD / EUR</SelectItem>
                              <SelectItem value="USD/GBP">USD / GBP</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="markupPercentage">Markup Percentage (%)</Label>
                      <Input
                        id="markupPercentage"
                        type="number"
                        step="0.01"
                        {...fxMarkupForm.register('markupPercentage', { valueAsNumber: true })}
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      {editingRule ? 'Update Markup' : 'Add Markup Rule'}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Fee Rule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this fee rule? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
