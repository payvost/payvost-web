'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { paymentsService } from '@/services/paymentsService';
import { walletService } from '@/services';
import type { SavedBillTemplate } from '@/components/bill-payment/saved-bill-templates';
import { SavedBillTemplates } from '@/components/bill-payment/saved-bill-templates';
import { BillPaymentHistory } from '@/components/bill-payment/bill-payment-history';
import { WalletSelector } from '@/components/bill-payment/wallet-selector';
import { PaymentConfirmationDialog } from '@/components/payment-confirmation-dialog';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

type Biller = {
  id: number;
  name: string;
  countryCode: string;
  localMinAmount: number;
  localMaxAmount: number;
  localTransactionFeeCurrencyCode: string;
};

function uuid(): string {
  const c = (globalThis as any).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `pv_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export default function PaymentsBillsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [country, setCountry] = useState('NG');
  const [billerSearch, setBillerSearch] = useState('');
  const [billers, setBillers] = useState<Biller[]>([]);
  const [loadingBillers, setLoadingBillers] = useState(false);

  const [selectedBillerId, setSelectedBillerId] = useState<string>('');
  const selectedBiller = useMemo(
    () => billers.find((b) => String(b.id) === selectedBillerId) || null,
    [billers, selectedBillerId]
  );

  const [subscriberAccountNumber, setSubscriberAccountNumber] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [sourceAccountId, setSourceAccountId] = useState<string>('');

  const targetCurrency = selectedBiller?.localTransactionFeeCurrencyCode?.toUpperCase() || '';
  const [quote, setQuote] = useState<any>(null);
  const [quoting, setQuoting] = useState(false);
  const quoteTimer = useRef<any>(null);

  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleFrequency, setScheduleFrequency] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingBillers(true);
      try {
        const res = await paymentsService.listBillers(country);
        if (!cancelled) setBillers((res.billers || []) as Biller[]);
      } catch (error: any) {
        console.error('Failed to load billers:', error);
        toast({
          title: 'Failed to load billers',
          description: error?.message || 'Please try again later',
          variant: 'destructive',
        });
        if (!cancelled) setBillers([]);
      } finally {
        if (!cancelled) setLoadingBillers(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [country, toast]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const userAccounts = await walletService.getAccounts();
        if (cancelled) return;
        setAccounts(userAccounts);
        if (!sourceAccountId && userAccounts?.length) {
          setSourceAccountId(userAccounts[0].id);
        }
      } catch (error) {
        console.error('Failed to load accounts:', error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sourceAccountId]);

  const filteredBillers = useMemo(() => {
    const q = billerSearch.trim().toLowerCase();
    if (!q) return billers;
    return billers.filter((b) => b.name.toLowerCase().includes(q));
  }, [billers, billerSearch]);

  // Quote preview debounce
  useEffect(() => {
    if (quoteTimer.current) clearTimeout(quoteTimer.current);
    setQuote(null);

    const amount = parseFloat(targetAmount);
    if (!selectedBiller || !sourceAccountId || !targetCurrency || !Number.isFinite(amount) || amount <= 0) return;

    quoteTimer.current = setTimeout(async () => {
      setQuoting(true);
      try {
        const q = await paymentsService.quote({
          type: 'BILL_PAYMENT',
          sourceAccountId,
          targetAmount: amount,
          targetCurrency,
          userTier: (user as any)?.tier || 'STANDARD',
        });
        setQuote(q);
      } catch (error: any) {
        console.error('Quote failed:', error);
        setQuote(null);
      } finally {
        setQuoting(false);
      }
    }, 400);

    return () => {
      if (quoteTimer.current) clearTimeout(quoteTimer.current);
    };
  }, [selectedBiller, sourceAccountId, targetAmount, targetCurrency, user]);

  const handleSubmit = async () => {
    const amount = parseFloat(targetAmount);
    if (!selectedBiller) {
      toast({ title: 'Select a biller', variant: 'destructive' });
      return;
    }
    if (!subscriberAccountNumber) {
      toast({ title: 'Enter account/meter number', variant: 'destructive' });
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      toast({ title: 'Enter a valid amount', variant: 'destructive' });
      return;
    }
    if (selectedBiller.localMinAmount && amount < selectedBiller.localMinAmount) {
      toast({
        title: 'Amount too low',
        description: `Minimum is ${selectedBiller.localMinAmount} ${targetCurrency}`,
        variant: 'destructive',
      });
      return;
    }
    if (selectedBiller.localMaxAmount && amount > selectedBiller.localMaxAmount) {
      toast({
        title: 'Amount too high',
        description: `Maximum is ${selectedBiller.localMaxAmount} ${targetCurrency}`,
        variant: 'destructive',
      });
      return;
    }
    if (!sourceAccountId) {
      toast({ title: 'Select a wallet', variant: 'destructive' });
      return;
    }

    await paymentsService.submit({
      type: 'BILL_PAYMENT',
      idempotencyKey: uuid(),
      sourceAccountId,
      targetAmount: amount,
      targetCurrency,
      userTier: (user as any)?.tier || 'STANDARD',
      details: {
        billerId: selectedBiller.id,
        billerName: selectedBiller.name,
        subscriberAccountNumber,
        countryCode: selectedBiller.countryCode,
      },
      schedule: scheduleEnabled
        ? { enabled: true, frequency: scheduleFrequency, timezone: 'UTC' }
        : { enabled: false, frequency: scheduleFrequency, timezone: 'UTC' },
    });

    toast({
      title: 'Submitted',
      description: 'Your bill payment is being processed.',
    });

    // Reset minimal fields (keep selected biller for repeat payments)
    setSubscriberAccountNumber('');
    setTargetAmount('');
    setScheduleEnabled(false);
  };

  const onSelectTemplate = (template: SavedBillTemplate) => {
    setSelectedBillerId(String(template.providerEntityId));
    setSubscriberAccountNumber(String(template.fields?.subscriberAccountNumber || ''));
  };

  const selectedSourceAccount = accounts.find((a) => a.id === sourceAccountId);
  const detailsForDialog = {
    sendAmount: quote ? Number(quote.sourceAmount).toFixed(2) : (parseFloat(targetAmount) || 0).toFixed(2),
    sendCurrency: quote?.sourceCurrency || selectedSourceAccount?.currency || targetCurrency || 'USD',
    recipientGets: (parseFloat(targetAmount) || 0).toFixed(2),
    recipientCurrency: targetCurrency || 'USD',
    recipientName: selectedBiller?.name || 'Bill Payment',
    exchangeRate:
      quote?.fxRate && quote?.needsConversion
        ? `1 ${quote.sourceCurrency} = ${Number(quote.fxRate).toFixed(6)} ${targetCurrency}`
        : 'N/A',
    fee: quote ? `${Number(quote.feeAmount || 0).toFixed(2)} ${quote.sourceCurrency}` : `0 ${targetCurrency || 'USD'}`,
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 sm:p-5 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-base font-semibold sm:text-lg md:text-2xl">Bill Payments</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SavedBillTemplates onSelectTemplate={onSelectTemplate} />

          <Card>
            <CardHeader>
              <CardTitle>Pay a Bill</CardTitle>
              <CardDescription>Provider-driven billers with server-authoritative processing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Select
                    value={country}
                    onValueChange={(v) => {
                      setCountry(v);
                      setSelectedBillerId('');
                      setBillerSearch('');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NG">Nigeria (NG)</SelectItem>
                      <SelectItem value="US">United States (US)</SelectItem>
                      <SelectItem value="GB">United Kingdom (GB)</SelectItem>
                      <SelectItem value="GH">Ghana (GH)</SelectItem>
                      <SelectItem value="KE">Kenya (KE)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Provider/Biller</Label>
                  <Input placeholder="Search billers..." value={billerSearch} onChange={(e) => setBillerSearch(e.target.value)} />
                  <Select
                    value={selectedBillerId}
                    onValueChange={(v) => {
                      setSelectedBillerId(v);
                    }}
                    disabled={loadingBillers}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingBillers ? 'Loading...' : 'Select a biller'} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredBillers.map((b) => (
                        <SelectItem key={b.id} value={String(b.id)}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {sourceAccountId && accounts.length > 0 ? (
                <WalletSelector
                  accounts={accounts}
                  selectedAccountId={sourceAccountId}
                  onSelectAccount={setSourceAccountId}
                  billCurrency={targetCurrency || selectedSourceAccount?.currency || 'USD'}
                  billAmount={parseFloat(targetAmount) || 0}
                />
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="acct">Account/Meter Number</Label>
                <Input
                  id="acct"
                  placeholder="Enter account or meter number"
                  value={subscriberAccountNumber}
                  onChange={(e) => setSubscriberAccountNumber(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amt">Amount {targetCurrency ? `(${targetCurrency})` : ''}</Label>
                <Input
                  id="amt"
                  type="number"
                  placeholder="Enter amount"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  disabled={!selectedBiller}
                />
                {selectedBiller ? (
                  <p className="text-sm text-muted-foreground">
                    Min: {selectedBiller.localMinAmount} {targetCurrency} • Max: {selectedBiller.localMaxAmount} {targetCurrency}
                  </p>
                ) : null}
              </div>

              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Quote</span>
                  {quoting ? (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Calculating...
                    </span>
                  ) : quote ? (
                    <span className="font-semibold">
                      {Number(quote.sourceAmount).toFixed(2)} {quote.sourceCurrency}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Enter amount to preview</span>
                  )}
                </div>
                {quote?.needsConversion ? (
                  <div className="mt-2 text-xs text-muted-foreground">
                    FX: 1 {quote.sourceCurrency} = {Number(quote.fxRate).toFixed(6)} {targetCurrency} • Fee:{' '}
                    {Number(quote.feeAmount).toFixed(2)} {quote.sourceCurrency}
                  </div>
                ) : null}
              </div>

              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="recurring"
                    checked={scheduleEnabled}
                    onChange={(e) => setScheduleEnabled(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="recurring" className="cursor-pointer">
                    Set up as recurring payment
                  </Label>
                </div>
                {scheduleEnabled ? (
                  <div className="pl-6 space-y-2">
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select value={scheduleFrequency} onValueChange={(v: any) => setScheduleFrequency(v)}>
                      <SelectTrigger id="frequency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
              </div>
            </CardContent>
            <CardFooter>
              <PaymentConfirmationDialog onConfirm={handleSubmit} transactionDetails={detailsForDialog}>
                <Button className="w-full sm:w-auto" disabled={!selectedBiller || !targetAmount || !subscriberAccountNumber}>
                  Pay Bill
                </Button>
              </PaymentConfirmationDialog>
            </CardFooter>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <BillPaymentHistory />
        </div>
      </div>
    </main>
    </DashboardLayout >
  );
}
