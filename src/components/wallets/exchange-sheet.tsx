'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Account } from '@/services';
import { transactionService } from '@/services';
import { Loader2 } from 'lucide-react';

function formatMoney(amount: number, currency: string, locale = 'en-US') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function secondsUntil(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.floor(ms / 1000));
}

function formatCountdown(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function ExchangeSheet(props: {
  wallets: Account[];
  isKycVerified: boolean;
  defaultFromAccountId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSettled: () => void;
  children?: React.ReactNode;
}) {
  const { wallets, isKycVerified, defaultFromAccountId, open: controlledOpen, onOpenChange, onSettled, children } = props;
  const { toast } = useToast();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [fromAccountId, setFromAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');

  const [quote, setQuote] = useState<any | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [expiresIn, setExpiresIn] = useState<number>(0);

  useEffect(() => {
    if (!open) return;
    // Defaults on open.
    const first = wallets[0]?.id || '';
    const fromDefault = defaultFromAccountId || first;
    const toDefault = wallets.find(w => w.id !== fromDefault)?.id || wallets[1]?.id || '';
    setFromAccountId(fromDefault);
    setToAccountId(toDefault);
    setAmount('');
    setQuote(null);
    setExpiresIn(0);
  }, [open, wallets, defaultFromAccountId]);

  const fromWallet = useMemo(() => wallets.find(w => w.id === fromAccountId) || null, [wallets, fromAccountId]);
  const toWallet = useMemo(() => wallets.find(w => w.id === toAccountId) || null, [wallets, toAccountId]);

  useEffect(() => {
    if (!quote?.expiresAt) return;
    const t = window.setInterval(() => {
      setExpiresIn(secondsUntil(String(quote.expiresAt)));
    }, 1000);
    return () => window.clearInterval(t);
  }, [quote?.expiresAt]);

  const fetchQuote = async () => {
    if (!fromWallet || !toWallet) return;
    const parsed = Number.parseFloat(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    if (fromWallet.id === toWallet.id) return;

    setLoadingQuote(true);
    try {
      const q = await transactionService.getQuote({
        fromAccountId: fromWallet.id,
        toAccountId: toWallet.id,
        amount: parsed,
        currency: fromWallet.currency,
      });
      setQuote(q);
      if (q?.expiresAt) setExpiresIn(secondsUntil(String(q.expiresAt)));
    } catch (e: any) {
      setQuote(null);
      toast({
        title: 'Unable to get quote',
        description: e?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoadingQuote(false);
    }
  };

  useEffect(() => {
    // Debounce quote generation
    if (!open) return;
    setQuote(null);
    const parsed = Number.parseFloat(amount);
    if (!fromWallet || !toWallet || !Number.isFinite(parsed) || parsed <= 0 || fromWallet.id === toWallet.id) return;
    const t = window.setTimeout(() => void fetchQuote(), 450);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromAccountId, toAccountId, amount, open]);

  const execute = async () => {
    if (!isKycVerified) return;
    if (!quote) {
      await fetchQuote();
      return;
    }
    if (expiresIn <= 0) {
      toast({ title: 'Quote expired', description: 'Please refresh the quote.', variant: 'destructive' });
      setQuote(null);
      return;
    }

    setExecuting(true);
    try {
      const idempotencyKey = `fx:${fromAccountId}:${toAccountId}:${Date.now()}`;
      await transactionService.executeWithQuote({ quote, idempotencyKey });
      toast({ title: 'Exchange completed', description: 'Your balances have been updated.' });
      onSettled();
      setOpen(false);
    } catch (e: any) {
      toast({
        title: 'Exchange failed',
        description: e?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setExecuting(false);
    }
  };

  const quoteRate = quote?.exchangeRate != null ? Number.parseFloat(String(quote.exchangeRate)) : null;
  const quoteFee = quote?.feeAmount != null ? Number.parseFloat(String(quote.feeAmount)) : null;
  const quoteTargetAmount = quote?.targetAmount != null ? Number.parseFloat(String(quote.targetAmount)) : null;
  const quoteTotalDebit = quote?.totalDebitAmount != null ? Number.parseFloat(String(quote.totalDebitAmount)) : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Exchange</DialogTitle>
          <DialogDescription>Swap funds between your wallets using a time-limited quote.</DialogDescription>
        </DialogHeader>

        {!isKycVerified ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Complete KYC to exchange currencies.
            <a className="ml-2 underline" href="/dashboard/profile">Go to profile</a>
          </div>
        ) : null}

        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>From</Label>
              <Select value={fromAccountId} onValueChange={setFromAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select wallet" />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map(w => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.currency} (bal {formatMoney(w.balance, w.currency)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>To</Label>
              <Select value={toAccountId} onValueChange={setToAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select wallet" />
                </SelectTrigger>
                <SelectContent>
                  {wallets.filter(w => w.id !== fromAccountId).map(w => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.currency} (bal {formatMoney(w.balance, w.currency)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fx-amount">Amount</Label>
            <Input id="fx-amount" inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>

          <div className="rounded-lg border p-4 text-sm space-y-2">
            {loadingQuote ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Getting quote…
              </div>
            ) : quote ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Rate</span>
                  <span className="font-mono">
                    {quoteRate == null || !fromWallet || !toWallet ? '—' : `1 ${fromWallet.currency} ≈ ${quoteRate.toFixed(6)} ${toWallet.currency}`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">You get</span>
                  <span className="font-mono">
                    {quoteTargetAmount == null || !toWallet ? '—' : formatMoney(quoteTargetAmount, toWallet.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Fee</span>
                  <span className="font-mono">
                    {quoteFee == null || !fromWallet ? '—' : formatMoney(quoteFee, fromWallet.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total debit</span>
                  <span className="font-mono">
                    {quoteTotalDebit == null || !fromWallet ? '—' : formatMoney(quoteTotalDebit, fromWallet.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Quote expires in</span>
                  <span className={expiresIn <= 20 ? 'font-mono text-rose-600' : 'font-mono'}>
                    {formatCountdown(expiresIn)}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-muted-foreground">
                Enter an amount to generate a quote.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={execute}
              className="w-full"
              disabled={!isKycVerified || executing || loadingQuote || !fromWallet || !toWallet || fromAccountId === toAccountId}
            >
              {(executing || loadingQuote) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {quote ? 'Confirm exchange' : 'Get quote'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

