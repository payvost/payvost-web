'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import type { Account } from '@/services';
import { walletService } from '@/services';
import { paymentService } from '@/services';
import { useAuth } from '@/hooks/use-auth';
import { Copy, Loader2, Landmark, CreditCard } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const STRIPE_TOPUP_CURRENCIES = new Set(['USD', 'EUR', 'GBP']); // Keep tight to backend provider routing.

function formatMoney(amount: number, currency: string, locale = 'en-US') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
  }).format(amount);
}

function formatFundingFieldLabel(key: string) {
  return key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
}

function copyText(text: string) {
  return navigator.clipboard.writeText(text);
}

function StripeTopUpForm(props: {
  clientSecret: string;
  paymentId: string;
  amount: number;
  currency: string;
  onClose: () => void;
  onSettled: () => void;
}) {
  const { clientSecret, paymentId, amount, currency, onClose, onSettled } = props;
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [confirming, setConfirming] = useState(false);
  const [polling, setPolling] = useState(false);

  const pollStatus = async () => {
    setPolling(true);
    const start = Date.now();
    const timeoutMs = 60_000;
    try {
      // Poll provider status. Wallet credit will arrive via webhook and may lag.
      while (Date.now() - start < timeoutMs) {
        const res = await paymentService.getStatus(paymentId);
        const status = String((res as any)?.status || '').toUpperCase();
        if (status === 'SUCCEEDED' || status === 'COMPLETED') return;
        if (status === 'FAILED' || status === 'CANCELED' || status === 'CANCELLED') {
          throw new Error(`Payment ${status.toLowerCase()}`);
        }
        await new Promise(r => setTimeout(r, 2000));
      }
    } finally {
      setPolling(false);
    }
  };

  const onConfirm = async () => {
    if (!stripe || !elements) return;
    setConfirming(true);
    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // Required by Stripe for some payment methods; keeps UX predictable.
          return_url: `${window.location.origin}/dashboard/wallets`,
        },
        redirect: 'if_required',
      });

      if (result.error) {
        throw new Error(result.error.message || 'Payment failed');
      }

      toast({
        title: 'Top-up initiated',
        description: `Processing ${formatMoney(amount, currency)}. This may take a few seconds.`,
      });

      await pollStatus();
      toast({ title: 'Payment succeeded', description: 'Refreshing your wallet balance.' });
      onSettled();
      onClose();
    } catch (e: any) {
      toast({
        title: 'Top-up failed',
        description: e?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="space-y-4">
      <PaymentElement />
      <DialogFooter>
        <Button onClick={onConfirm} className="w-full" disabled={!stripe || confirming || polling}>
          {(confirming || polling) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Confirm top-up
        </Button>
      </DialogFooter>
    </div>
  );
}

export function FundWalletSheet(props: {
  account: Account;
  isKycVerified: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSettled: () => void;
  children?: React.ReactNode;
}) {
  const { account, isKycVerified, open: controlledOpen, onOpenChange, onSettled, children } = props;
  const { toast } = useToast();
  const { user } = useAuth();

  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [loadingBank, setLoadingBank] = useState(false);
  const [fundingSource, setFundingSource] = useState<any | null>(null);

  const [amount, setAmount] = useState<string>('');
  const [loadingIntent, setLoadingIntent] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  const canStripeTopUp = STRIPE_TOPUP_CURRENCIES.has(account.currency.toUpperCase());

  const reference = useMemo(() => `PV-${account.id}`, [account.id]);

  const loadFundingInstructions = async () => {
    setLoadingBank(true);
    try {
      const res = await walletService.getFundingInstructions(account.id);
      setFundingSource(res.fundingSource);
    } catch {
      setFundingSource(null);
    } finally {
      setLoadingBank(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    // Reset transient states on open.
    setClientSecret(null);
    setPaymentId(null);
    setAmount('');
    loadFundingInstructions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, account.id]);

  const handleCreateFundingInstructions = async () => {
    if (!isKycVerified) return;
    setLoadingBank(true);
    try {
      const res = await walletService.createFundingInstructions(account.id);
      setFundingSource(res.fundingSource);
      toast({ title: 'Deposit details ready', description: 'Use these details to fund your wallet by bank transfer.' });
    } catch (e: any) {
      toast({
        title: 'Unable to generate deposit details',
        description: e?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoadingBank(false);
    }
  };

  const handleCopyBankDetails = async () => {
    if (!fundingSource) return;
    const details = fundingSource.details || {};
    const bank = details.bank_account || details.bankAccount || {};
    const lines = [
      `Currency: ${account.currency}`,
      `Beneficiary: ${bank.beneficiary_name || bank.beneficiaryName || ''}`,
      `Bank: ${bank.bank_name || bank.bankName || ''}`,
      `Account number: ${bank.account_number || bank.accountNumber || ''}`,
      bank.routing_number || bank.routingNumber ? `Routing: ${bank.routing_number || bank.routingNumber}` : null,
      bank.iban ? `IBAN: ${bank.iban}` : null,
      bank.bic_swift || bank.bicSwift ? `SWIFT/BIC: ${bank.bic_swift || bank.bicSwift}` : null,
      `Reference/Memo: ${reference}`,
    ].filter(Boolean).join('\n');

    await copyText(lines);
    toast({ title: 'Copied', description: 'Deposit details copied to clipboard.' });
  };

  const handleCreateIntent = async () => {
    if (!user) {
      toast({ title: 'Not signed in', description: 'Please sign in and try again.', variant: 'destructive' });
      return;
    }

    const parsed = Number.parseFloat(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast({ title: 'Invalid amount', description: 'Enter an amount greater than 0.', variant: 'destructive' });
      return;
    }

    setLoadingIntent(true);
    try {
      const idempotencyKey = `wallet_topup:${account.id}:${Date.now()}`;
      const res = await paymentService.createIntent({
        amount: parsed,
        currency: account.currency,
        paymentMethod: 'CARD',
        description: `Wallet top-up (${account.currency})`,
        idempotencyKey,
        metadata: {
          purpose: 'WALLET_TOPUP',
          accountId: account.id,
          userId: user.uid,
        },
        // Steer routing to Stripe-supported regions for card top-ups.
        sourceCountry: 'US',
        destinationCountry: 'US',
      });

      if (!res.clientSecret) {
        throw new Error('Missing Stripe client secret');
      }

      setClientSecret(res.clientSecret);
      setPaymentId(res.paymentId);
    } catch (e: any) {
      toast({
        title: 'Unable to start top-up',
        description: e?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoadingIntent(false);
    }
  };

  const bank = fundingSource?.details?.bank_account || null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Fund {account.currency} wallet</DialogTitle>
          <DialogDescription>Bank transfer or card top-up (Stripe).</DialogDescription>
        </DialogHeader>

        {!isKycVerified ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Complete KYC to fund wallets.
            <a className="ml-2 underline" href="/dashboard/profile">Go to profile</a>
          </div>
        ) : null}

        <Tabs defaultValue="bank">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bank">
              <Landmark className="mr-2 h-4 w-4" />
              Bank transfer
            </TabsTrigger>
            <TabsTrigger value="card" disabled={!canStripeTopUp}>
              <CreditCard className="mr-2 h-4 w-4" />
              Card
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bank" className="pt-4 space-y-4">
            {loadingBank ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading deposit details…
              </div>
            ) : fundingSource && bank ? (
              <>
                <div className="space-y-3 rounded-lg border p-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {Object.entries(bank).map(([key, value]) => {
                      if (!value) return null;
                      return (
                        <div key={key} className="text-sm">
                          <div className="text-xs text-muted-foreground">{formatFundingFieldLabel(key)}</div>
                          <div className="font-semibold break-words">{String(value)}</div>
                        </div>
                      );
                    })}
                  </div>

                  <Separator />

                  <div className="text-sm">
                    <div className="text-xs text-muted-foreground">Reference / Memo</div>
                    <div className="font-semibold">{reference}</div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Include the reference to help us auto-match your deposit.
                  </p>
                </div>

                <Button variant="outline" className="w-full" onClick={handleCopyBankDetails}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy details
                </Button>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Generate bank details for a local transfer into this wallet.
                </p>
                <Button onClick={handleCreateFundingInstructions} disabled={!isKycVerified || loadingBank} className="w-full">
                  {loadingBank ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Generate deposit details
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="card" className="pt-4 space-y-4">
            {!canStripeTopUp ? (
              <div className="text-sm text-muted-foreground">
                Card top-ups are currently supported for USD, EUR, and GBP.
              </div>
            ) : clientSecret && paymentId ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <StripeTopUpForm
                  clientSecret={clientSecret}
                  paymentId={paymentId}
                  amount={Number.parseFloat(amount) || 0}
                  currency={account.currency}
                  onClose={() => setOpen(false)}
                  onSettled={onSettled}
                />
              </Elements>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="topup-amount">Amount</Label>
                  <Input
                    id="topup-amount"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    You will be charged in {account.currency}. Funds will be credited after confirmation.
                  </p>
                </div>

                <Button onClick={handleCreateIntent} disabled={!isKycVerified || loadingIntent} className="w-full">
                  {loadingIntent ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Continue
                </Button>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
