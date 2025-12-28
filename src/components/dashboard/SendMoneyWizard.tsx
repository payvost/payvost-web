'use client';

import React, { useEffect, useState } from 'react';
import { useTransfer } from '@/hooks/use-transfer';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export function SendMoneyWizard({ onComplete }: { onComplete?: () => void }) {
    const { wallets, refreshWallets } = useDashboardData();
    const transfer = useTransfer();
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (transfer.step === 'recipient') {
            transfer.fetchRecipients();
        }
    }, [transfer.step, transfer.fetchRecipients]);

    const filteredSaved = transfer.savedRecipients.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredUsers = transfer.recipients.filter(r =>
        r.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAmountSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        transfer.getQuote();
    };

    const handleExecute = async () => {
        await transfer.executeTransfer();
        refreshWallets();
        if (onComplete) onComplete();
    };

    // Helper to format currency
    const formatCurrency = (amount: any, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(Number(amount));
    };

    if (transfer.step === 'recipient') {
        return (
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0 pt-0">
                    <CardTitle>Select Recipient</CardTitle>
                    <CardDescription>Who are you sending money to?</CardDescription>
                </CardHeader>
                <CardContent className="px-0 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or email"
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                        {transfer.loadingRecipients ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : (filteredSaved.length > 0 || filteredUsers.length > 0) ? (
                            <>
                                {filteredSaved.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Saved Beneficiaries</p>
                                        {filteredSaved.map(r => (
                                            <div
                                                key={r.id}
                                                onClick={() => transfer.selectRecipient(r)}
                                                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                        {r.name[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{r.name}</p>
                                                        <p className="text-xs text-muted-foreground">{r.email || r.bankName || 'Saved Beneficiary'}</p>
                                                    </div>
                                                </div>
                                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {filteredUsers.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mt-4">Payvost Users</p>
                                        {filteredUsers.map(r => (
                                            <div
                                                key={r.uid}
                                                onClick={() => transfer.selectRecipient(r)}
                                                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarImage src={r.photoURL} />
                                                        <AvatarFallback>{r.fullName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{r.fullName}</p>
                                                        <p className="text-xs text-muted-foreground">{r.email}</p>
                                                    </div>
                                                </div>
                                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-12 flex flex-col items-center gap-2">
                                <Users className="h-8 w-8 text-muted-foreground/50" />
                                <p className="text-muted-foreground text-sm">No recipients found</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (transfer.step === 'amount') {
        const fromAccount = wallets.find(w => w.id === transfer.fromAccountId) || wallets[0];

        return (
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0 pt-0">
                    <div className="flex items-center gap-2 mb-2">
                        <Button variant="ghost" size="sm" onClick={() => transfer.setStep('recipient')} className="h-8 p-0">
                            <ArrowRight className="h-4 w-4 rotate-180 mr-1" /> Back
                        </Button>
                    </div>
                    <CardTitle>Enter Amount</CardTitle>
                    <CardDescription>Sending to {'name' in (transfer.recipient || {}) ? (transfer.recipient as any).name : (transfer.recipient as any).fullName}</CardDescription>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                    <form onSubmit={handleAmountSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>From Wallet</Label>
                            <Select
                                value={transfer.fromAccountId || fromAccount?.id}
                                onValueChange={(val) => transfer.updateAmount(transfer.amount, transfer.currency, val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select account" />
                                </SelectTrigger>
                                <SelectContent>
                                    {wallets.map(w => (
                                        <SelectItem key={w.id} value={w.id}>
                                            <div className="flex justify-between w-full gap-4">
                                                <span>{w.name} ({w.currency})</span>
                                                <span className="font-medium">{formatCurrency(w.balance, w.currency)}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Amount</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 font-medium">{fromAccount?.currency}</span>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="pl-14 text-lg font-semibold"
                                    value={transfer.amount || ''}
                                    onChange={(e) => transfer.updateAmount(parseFloat(e.target.value) || 0, fromAccount?.currency || 'USD', transfer.fromAccountId || fromAccount?.id)}
                                    required
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Available: {formatCurrency(fromAccount?.balance, fromAccount?.currency)}
                            </p>
                        </div>

                        <Button type="submit" className="w-full" disabled={transfer.loading || transfer.amount <= 0}>
                            {transfer.loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Continue"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        );
    }

    if (transfer.step === 'quote' && transfer.quote) {
        const { quote } = transfer;
        return (
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0 pt-0">
                    <div className="flex items-center gap-2 mb-2">
                        <Button variant="ghost" size="sm" onClick={() => transfer.setStep('amount')} className="h-8 p-0">
                            <ArrowRight className="h-4 w-4 rotate-180 mr-1" /> Back
                        </Button>
                    </div>
                    <CardTitle>Confirm Transfer</CardTitle>
                    <CardDescription>Review the details before sending</CardDescription>
                </CardHeader>
                <CardContent className="px-0 space-y-4">
                    <div className="p-4 rounded-xl bg-accent/50 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">You Send</span>
                            <span className="font-semibold">{formatCurrency(quote.amount, quote.currency)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Recipient Gets</span>
                            <span className="font-semibold text-primary">{formatCurrency(quote.targetAmount, quote.targetCurrency)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Exchange Rate</span>
                            <span>1 {quote.currency} = {Number(quote.exchangeRate).toFixed(4)} {quote.targetCurrency}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Fee</span>
                            <span>{formatCurrency(quote.feeAmount, quote.currency)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold">
                            <span>Total to Deduct</span>
                            <span>{formatCurrency(quote.totalDebitAmount, quote.currency)}</span>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                        <p className="text-xs text-blue-400">
                            This quote is valid for 5 minutes. The funds will be transferred instantly to {'name' in (transfer.recipient || {}) ? (transfer.recipient as any).name : (transfer.recipient as any).fullName}'s primary wallet.
                        </p>
                    </div>
                </CardContent>
                <CardFooter className="px-0 pt-4">
                    <Button onClick={handleExecute} className="w-full h-11" disabled={transfer.loading}>
                        {transfer.loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Confirm & Send"}
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    if (transfer.step === 'success') {
        return (
            <Card className="border-none shadow-none bg-transparent py-4">
                <CardContent className="px-0 flex flex-col items-center text-center space-y-6">
                    <div className="h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center">
                        <CheckCircle2 className="h-12 w-12 text-green-500" />
                    </div>
                    <div className="space-y-2">
                        <CardTitle className="text-2xl">Transfer Successful!</CardTitle>
                        <p className="text-muted-foreground">
                            You've sent {formatCurrency(transfer.quote?.targetAmount, transfer.quote?.targetCurrency)} to {'name' in (transfer.recipient || {}) ? (transfer.recipient as any).name : (transfer.recipient as any).fullName}.
                        </p>
                    </div>
                    <div className="w-full space-y-2">
                        <div className="flex justify-between text-sm p-3 border rounded-lg">
                            <span className="text-muted-foreground">Transaction ID</span>
                            <span className="font-mono text-xs">{transfer.transferResult?.id || '---'}</span>
                        </div>
                        <Button variant="outline" className="w-full" onClick={transfer.reset}>
                            Send More Money
                        </Button>
                        <Button className="w-full" onClick={onComplete}>
                            Done
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return null;
}
