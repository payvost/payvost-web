
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Trash2, Edit, Percent, FileText, DollarSign, Landmark, Smartphone } from 'lucide-react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

const transactionFeeRuleSchema = z.object({
    region: z.string().min(1, "Region is required"),
    type: z.string().min(1, "Type is required"),
    feeType: z.enum(['fixed', 'percentage', 'combo']),
    fixedRate: z.number().optional(),
    percentageRate: z.number().optional(),
});

type TransactionFeeRuleFormValues = z.infer<typeof transactionFeeRuleSchema>;

const payoutFeeRuleSchema = z.object({
    method: z.string().min(1, "Method is required"),
    country: z.string().min(1, "Country is required"),
    feeType: z.enum(['fixed', 'percentage', 'combo']),
    fixedRate: z.number().optional(),
    percentageRate: z.number().optional(),
});

type PayoutFeeRuleFormValues = z.infer<typeof payoutFeeRuleSchema>;

const fxMarkupRuleSchema = z.object({
    currencyPair: z.string().min(1, "Currency pair is required"),
    markupPercentage: z.number().min(0, "Markup must be a non-negative number"),
});

type FxMarkupRuleFormValues = z.infer<typeof fxMarkupRuleSchema>;


const initialTransactionFeeRules = [
    { id: 'rule_1', region: 'USA -> NGA', type: 'P2P Transfer', fee: '1.5% + $2.00' },
    { id: 'rule_2', region: 'Global', type: 'Bill Payment', fee: '0.5%' },
    { id: 'rule_3', region: 'GBR -> GHA', type: 'P2P Transfer', fee: '£1.50' },
];

const initialPayoutFeeRules = [
    { id: 'payout_1', method: 'Bank Transfer (NGN)', country: 'Nigeria', fee: '₦50.00' },
    { id: 'payout_2', method: 'Mobile Money (GHS)', country: 'Ghana', fee: '1.0%' },
    { id: 'payout_3', method: 'Card Payout (USD)', country: 'Global', fee: '0.5% + $0.30' },
];

const initialFxMarkupRules = [
    { id: 'fx_1', currencyPair: 'USD/NGN', markup: '0.75%' },
    { id: 'fx_2', currencyPair: 'GBP/GHS', markup: '1.00%' },
    { id: 'fx_3', currencyPair: 'EUR/KES', markup: '0.80%' },
];

export default function FeeConfigurationPage() {
    const { toast } = useToast();
    const [transactionRules, setTransactionRules] = useState(initialTransactionFeeRules);
    const [payoutRules, setPayoutRules] = useState(initialPayoutFeeRules);
    const [fxMarkupRules, setFxMarkupRules] = useState(initialFxMarkupRules);
    
    const transactionForm = useForm<TransactionFeeRuleFormValues>({
        resolver: zodResolver(transactionFeeRuleSchema),
        defaultValues: { region: 'Global', type: 'P2P Transfer', feeType: 'percentage' }
    });

    const payoutForm = useForm<PayoutFeeRuleFormValues>({
        resolver: zodResolver(payoutFeeRuleSchema),
        defaultValues: { method: 'Bank Transfer', country: 'Global', feeType: 'fixed' }
    });
    
    const fxMarkupForm = useForm<FxMarkupRuleFormValues>({
        resolver: zodResolver(fxMarkupRuleSchema),
        defaultValues: { currencyPair: 'USD/EUR', markupPercentage: 0.5 }
    });


    const onTransactionSubmit = (data: TransactionFeeRuleFormValues) => {
        const newRule = {
            id: `rule_${Date.now()}`,
            region: data.region,
            type: data.type,
            fee: `${data.percentageRate || 0}% + $${data.fixedRate || 0}` // Simplified display
        };
        setTransactionRules(prev => [...prev, newRule]);
        toast({ title: "Transaction Fee Rule Added", description: `A new fee rule for ${data.type} has been created.` });
        transactionForm.reset();
    };
    
    const onPayoutSubmit = (data: PayoutFeeRuleFormValues) => {
        const newRule = {
            id: `payout_${Date.now()}`,
            method: data.method,
            country: data.country,
            fee: `${data.percentageRate || 0}% + $${data.fixedRate || 0}` // Simplified display
        };
        setPayoutRules(prev => [...prev, newRule]);
        toast({ title: "Payout Fee Rule Added", description: `A new fee rule for ${data.method} has been created.` });
        payoutForm.reset();
    }
    
    const onFxMarkupSubmit = (data: FxMarkupRuleFormValues) => {
        const newRule = {
            id: `fx_${Date.now()}`,
            currencyPair: data.currencyPair,
            markup: `${data.markupPercentage}%`
        };
        setFxMarkupRules(prev => [...prev, newRule]);
        toast({ title: "FX Markup Rule Added", description: `A new markup for ${data.currencyPair} has been set.` });
        fxMarkupForm.reset();
    };


    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Fee Configuration</h2>
                    <p className="text-muted-foreground">Manage and set fee structures for your platform.</p>
                </div>
            </div>

            <Tabs defaultValue="transaction-fees">
                <TabsList>
                    <TabsTrigger value="transaction-fees"><DollarSign className="mr-2 h-4 w-4"/>Transaction Fees</TabsTrigger>
                    <TabsTrigger value="payout-fees"><FileText className="mr-2 h-4 w-4"/>Payout Fees</TabsTrigger>
                    <TabsTrigger value="fx-markups"><Percent className="mr-2 h-4 w-4"/>FX Markups</TabsTrigger>
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
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Region/Corridor</TableHead>
                                                <TableHead>Transaction Type</TableHead>
                                                <TableHead>Fee</TableHead>
                                                <TableHead><span className="sr-only">Actions</span></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {transactionRules.map(rule => (
                                                <TableRow key={rule.id}>
                                                    <TableCell className="font-medium">{rule.region}</TableCell>
                                                    <TableCell>{rule.type}</TableCell>
                                                    <TableCell className="font-mono">{rule.fee}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon"><Edit className="h-4 w-4"/></Button>
                                                        <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="lg:col-span-1">
                             <Card>
                                <form onSubmit={transactionForm.handleSubmit(onTransactionSubmit)}>
                                    <CardHeader>
                                        <CardTitle>Create New Transaction Rule</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="region">Region/Corridor</Label>
                                            <Controller name="region" control={transactionForm.control} render={({ field }) => (
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Global">Global</SelectItem>
                                                        <SelectItem value="USA -> NGA">USA -&gt; Nigeria</SelectItem>
                                                        <SelectItem value="GBR -> GHA">UK -&gt; Ghana</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )} />
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="type">Transaction Type</Label>
                                             <Controller name="type" control={transactionForm.control} render={({ field }) => (
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="P2P Transfer">P2P Transfer</SelectItem>
                                                        <SelectItem value="Bill Payment">Bill Payment</SelectItem>
                                                        <SelectItem value="Card Funding">Card Funding</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )} />
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="feeType">Fee Type</Label>
                                              <Controller name="feeType" control={transactionForm.control} render={({ field }) => (
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="fixed">Fixed Rate</SelectItem>
                                                        <SelectItem value="percentage">Percentage</SelectItem>
                                                        <SelectItem value="combo">Fixed + Percentage</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                             <div className="space-y-2">
                                                <Label htmlFor="percentageRate">Percentage (%)</Label>
                                                <Input id="percentageRate" type="number" step="0.01" {...transactionForm.register('percentageRate', { valueAsNumber: true })} />
                                             </div>
                                             <div className="space-y-2">
                                                <Label htmlFor="fixedRate">Fixed Rate ($)</Label>
                                                <Input id="fixedRate" type="number" step="0.01" {...transactionForm.register('fixedRate', { valueAsNumber: true })} />
                                             </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button type="submit" className="w-full"><PlusCircle className="mr-2 h-4 w-4"/>Add Rule</Button>
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
                                    <CardDescription>Configure fees for different payout methods (e.g., Bank Transfer, Mobile Money).</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Payout Method</TableHead>
                                                <TableHead>Country</TableHead>
                                                <TableHead>Fee</TableHead>
                                                <TableHead><span className="sr-only">Actions</span></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {payoutRules.map(rule => (
                                                <TableRow key={rule.id}>
                                                    <TableCell className="font-medium">{rule.method}</TableCell>
                                                    <TableCell>{rule.country}</TableCell>
                                                    <TableCell className="font-mono">{rule.fee}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon"><Edit className="h-4 w-4"/></Button>
                                                        <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="lg:col-span-1">
                             <Card>
                                <form onSubmit={payoutForm.handleSubmit(onPayoutSubmit)}>
                                    <CardHeader>
                                        <CardTitle>Create New Payout Rule</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="payout-method">Payout Method</Label>
                                            <Controller name="method" control={payoutForm.control} render={({ field }) => (
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <SelectTrigger id="payout-method"><SelectValue/></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                                        <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                                                        <SelectItem value="Card Payout">Card Payout</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )} />
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="payout-country">Country</Label>
                                             <Controller name="country" control={payoutForm.control} render={({ field }) => (
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <SelectTrigger id="payout-country"><SelectValue/></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Global">Global</SelectItem>
                                                        <SelectItem value="Nigeria">Nigeria</SelectItem>
                                                        <SelectItem value="Ghana">Ghana</SelectItem>
                                                        <SelectItem value="Kenya">Kenya</SelectItem>
                                                        <SelectItem value="USA">USA</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                             <div className="space-y-2">
                                                <Label htmlFor="payout-percentageRate">Percentage (%)</Label>
                                                <Input id="payout-percentageRate" type="number" step="0.01" {...payoutForm.register('percentageRate', { valueAsNumber: true })} />
                                             </div>
                                             <div className="space-y-2">
                                                <Label htmlFor="payout-fixedRate">Fixed Rate ($)</Label>
                                                <Input id="payout-fixedRate" type="number" step="0.01" {...payoutForm.register('fixedRate', { valueAsNumber: true })} />
                                             </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button type="submit" className="w-full"><PlusCircle className="mr-2 h-4 w-4"/>Add Payout Rule</Button>
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
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Currency Pair</TableHead>
                                                <TableHead>Markup</TableHead>
                                                <TableHead><span className="sr-only">Actions</span></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {fxMarkupRules.map(rule => (
                                                <TableRow key={rule.id}>
                                                    <TableCell className="font-medium">{rule.currencyPair}</TableCell>
                                                    <TableCell className="font-mono">{rule.markup}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon"><Edit className="h-4 w-4"/></Button>
                                                        <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="lg:col-span-1">
                             <Card>
                                <form onSubmit={fxMarkupForm.handleSubmit(onFxMarkupSubmit)}>
                                    <CardHeader>
                                        <CardTitle>Add New FX Markup</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="currencyPair">Currency Pair</Label>
                                            <Controller name="currencyPair" control={fxMarkupForm.control} render={({ field }) => (
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <SelectTrigger id="currencyPair"><SelectValue/></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="USD/NGN">USD / NGN</SelectItem>
                                                        <SelectItem value="GBP/GHS">GBP / GHS</SelectItem>
                                                        <SelectItem value="EUR/KES">EUR / KES</SelectItem>
                                                        <SelectItem value="USD/EUR">USD / EUR</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )} />
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="markupPercentage">Markup Percentage (%)</Label>
                                            <Input id="markupPercentage" type="number" step="0.01" {...fxMarkupForm.register('markupPercentage', { valueAsNumber: true })} />
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button type="submit" className="w-full"><PlusCircle className="mr-2 h-4 w-4"/>Add Markup Rule</Button>
                                    </CardFooter>
                                </form>
                            </Card>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </>
    );
}
