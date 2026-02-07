'use client';

import { useEffect, useMemo, useState } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

import { apiClient, externalTransactionService, transactionService, walletService, type Account } from '@/services';

import { WalletsPageSkeleton } from '@/components/skeletons/wallets-page-skeleton';
import { WalletsHeader } from '@/components/wallets/wallets-header';
import { BalanceSummary } from '@/components/wallets/balance-summary';
import { WalletList } from '@/components/wallets/wallet-list';
import { WalletActivityFeed, type ActivityItem } from '@/components/wallets/wallet-activity-feed';
import { FundWalletSheet } from '@/components/wallets/fund-wallet-sheet';
import { ExchangeSheet } from '@/components/wallets/exchange-sheet';
import { EmptyState } from '@/components/empty-state';
import { Wallet } from 'lucide-react';

import { SUPPORTED_COUNTRIES } from '@/config/kyc-config';

function parseNumber(v: any): number {
  if (typeof v === 'number') return v;
  const n = Number.parseFloat(String(v ?? '0'));
  return Number.isFinite(n) ? n : 0;
}

export default function WalletsPage() {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [isKycVerified, setIsKycVerified] = useState(false);
  const [homeCurrency, setHomeCurrency] = useState<string>('USD');

  const [wallets, setWallets] = useState<Account[]>([]);
  const [loadingWallets, setLoadingWallets] = useState(true);

  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [ratesTimestamp, setRatesTimestamp] = useState<string | null>(null);
  const [loadingRates, setLoadingRates] = useState(false);

  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  const [fundOpen, setFundOpen] = useState(false);
  const [fundAccount, setFundAccount] = useState<Account | null>(null);

  const [exchangeOpen, setExchangeOpen] = useState(false);
  const [exchangeFromId, setExchangeFromId] = useState<string | undefined>(undefined);

  const [createWalletOpen, setCreateWalletOpen] = useState(false);

  // Firestore: KYC + homeCurrency (source of truth for now).
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);
    const unsub = onSnapshot(userDocRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      const status = String(data.kycStatus || '').toLowerCase();
      setIsKycVerified(status === 'verified' || status === 'tier1_verified');

      const inferredHomeCurrency =
        typeof data.homeCurrency === 'string' && data.homeCurrency
          ? data.homeCurrency
          : (typeof data.country === 'string'
              ? (SUPPORTED_COUNTRIES.find((c) => c.iso2 === data.country)?.currency ?? 'USD')
              : 'USD');
      setHomeCurrency(String(inferredHomeCurrency || 'USD').toUpperCase());
    });

    return () => unsub();
  }, [user]);

  const refreshWallets = async () => {
    if (!user) return;
    setLoadingWallets(true);
    try {
      const accounts = await walletService.getAccounts();
      const normalized = accounts.map((a) => ({
        ...a,
        balance: typeof a.balance === 'string' ? parseFloat(a.balance) : a.balance,
      }));
      setWallets(normalized);
    } catch (e) {
      console.error('Failed to fetch wallets:', e);
      toast({ title: 'Error', description: 'Failed to load wallets.', variant: 'destructive' });
      setWallets([]);
    } finally {
      setLoadingWallets(false);
    }
  };

  useEffect(() => {
    if (!user) {
      if (!authLoading) setLoadingWallets(false);
      return;
    }
    void refreshWallets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  // Rates for estimated total (homeCurrency base).
  useEffect(() => {
    if (!homeCurrency) return;
    let cancelled = false;
    const run = async () => {
      setLoadingRates(true);
      try {
        const res = await apiClient.get<{ base: string; timestamp: string; rates: Record<string, number> }>(
          `/api/currency/rates?base=${encodeURIComponent(homeCurrency)}`
        );
        if (cancelled) return;
        setRates(res.rates || null);
        setRatesTimestamp(res.timestamp || null);
      } catch (e) {
        console.warn('Failed to fetch rates:', e);
        if (cancelled) return;
        setRates(null);
        setRatesTimestamp(null);
      } finally {
        if (!cancelled) setLoadingRates(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [homeCurrency]);

  const primaryCurrency = useMemo(() => {
    if (homeCurrency) return homeCurrency;
    return wallets[0]?.currency || 'USD';
  }, [homeCurrency, wallets]);

  const primaryWallet = useMemo(() => {
    if (wallets.length === 0) return null;
    const byHome = wallets.find(w => w.currency === primaryCurrency);
    return byHome || wallets[0];
  }, [wallets, primaryCurrency]);

  const totalEstimated = useMemo(() => {
    if (!rates || wallets.length === 0) return null;

    // Our rates map is "1 baseCurrency = rate[currency] currency".
    // To convert X currency -> baseCurrency: X / rate[currency].
    let sum = 0;
    for (const w of wallets) {
      const r = rates[w.currency];
      if (!r || r <= 0) continue;
      sum += (w.balance || 0) / r;
    }
    return sum;
  }, [rates, wallets]);

  // Unified activity feed: ledger + transfers + external transactions.
  useEffect(() => {
    if (!user) {
      setActivity([]);
      setLoadingActivity(false);
      return;
    }

    let cancelled = false;
    const run = async () => {
      setLoadingActivity(true);
      try {
        const [ledgerRes, transfersRes, externalRes] = await Promise.allSettled([
          walletService.getActivity({ limit: 50, offset: 0 }),
          transactionService.list({ limit: 20, offset: 0 }),
          externalTransactionService.getByUser(user.uid, { limit: 20, offset: 0 }),
        ]);

        const items: ActivityItem[] = [];

        if (ledgerRes.status === 'fulfilled') {
          for (const entry of ledgerRes.value.items || []) {
            const rawAmount = parseNumber(entry.amount);
            const direction = String(entry.type || '').toUpperCase() === 'DEBIT' ? 'debit' : 'credit';
            items.push({
              kind: 'ledger',
              id: entry.id,
              createdAt: entry.createdAt,
              currency: wallets.find(w => w.id === entry.accountId)?.currency || homeCurrency || 'USD',
              amount: Math.abs(rawAmount),
              direction,
              description: entry.description || null,
            });
          }
        }

        if (transfersRes.status === 'fulfilled') {
          for (const t of transfersRes.value || []) {
            items.push({
              kind: 'transfer',
              id: t.id,
              createdAt: t.createdAt,
              currency: String(t.currency || 'USD').toUpperCase(),
              amount: parseNumber(t.amount),
              status: t.status,
              description: t.description || null,
            });
          }
        }

        if (externalRes.status === 'fulfilled') {
          const list = externalRes.value as any;
          const arr = Array.isArray(list) ? list : (list?.transactions ?? list?.data ?? []);
          for (const tx of (Array.isArray(arr) ? arr : [])) {
            items.push({
              kind: 'external',
              id: String(tx.id),
              createdAt: (tx.createdAt ?? tx.date ?? new Date().toISOString()).toString(),
              currency: String(tx.currency || 'USD').toUpperCase(),
              amount: parseNumber(tx.amount),
              status: String(tx.status || ''),
              description: String(tx.type || tx.description || 'External transaction'),
              provider: tx.provider ? String(tx.provider) : null,
            });
          }
        }

        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        if (!cancelled) setActivity(items.slice(0, 50));
      } catch (e) {
        console.error('Failed to load activity:', e);
        if (!cancelled) setActivity([]);
      } finally {
        if (!cancelled) setLoadingActivity(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [user, wallets, homeCurrency]);

  const isLoading = authLoading || loadingWallets;
  if (isLoading) {
    return <WalletsPageSkeleton language={language} setLanguage={setLanguage} />;
  }

  const openFund = (account: Account) => {
    setFundAccount(account);
    setFundOpen(true);
  };

  const openExchange = (fromAccountId?: string) => {
    setExchangeFromId(fromAccountId);
    setExchangeOpen(true);
  };

  const onSettled = async () => {
    await refreshWallets();
  };

  return (
    <DashboardLayout language={language} setLanguage={setLanguage}>
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Wallets</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <WalletsHeader
          isKycVerified={isKycVerified}
          wallets={wallets}
          requiredCurrencyFirst={homeCurrency}
          onWalletCreated={refreshWallets}
          onFund={() => primaryWallet && openFund(primaryWallet)}
          onExchange={() => openExchange(primaryWallet?.id)}
          createOpen={createWalletOpen}
          onCreateOpenChange={setCreateWalletOpen}
        />

        {!isKycVerified ? (
          <Alert>
            <AlertTitle>KYC required</AlertTitle>
            <AlertDescription>
              Complete identity verification to create wallets, fund balances, and exchange currencies.{' '}
              <a className="underline underline-offset-4" href="/dashboard/profile">Go to profile</a>.
            </AlertDescription>
          </Alert>
        ) : null}

        {wallets.length === 0 ? (
          <EmptyState
            icon={<Wallet className="h-16 w-16" />}
            title="Create your first wallet"
            description="Add a currency wallet to hold balances, receive deposits, and exchange between currencies."
            action={isKycVerified ? {
              label: 'Add wallet',
              onClick: () => setCreateWalletOpen(true),
            } : undefined}
            secondaryAction={!isKycVerified ? {
              label: 'Complete KYC',
              onClick: () => { window.location.href = '/dashboard/profile'; },
              variant: 'outline',
            } : undefined}
            size="lg"
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-3">
              <BalanceSummary
                homeCurrency={primaryCurrency}
                totalEstimated={totalEstimated}
                ratesTimestamp={ratesTimestamp}
                loading={loadingRates}
              />
            </div>

            <div className="lg:col-span-2 space-y-6">
              <WalletList
                wallets={wallets}
                primaryCurrency={primaryCurrency}
                onFund={openFund}
                onExchangeFrom={(w) => openExchange(w.id)}
                onDetails={(w) => (window.location.href = `/dashboard/wallets/${w.id}`)}
              />
            </div>

            <div className="lg:col-span-1">
              <WalletActivityFeed items={activity} loading={loadingActivity} />
            </div>
          </div>
        )}

        {fundAccount ? (
          <FundWalletSheet
            account={fundAccount}
            isKycVerified={isKycVerified}
            open={fundOpen}
            onOpenChange={setFundOpen}
            onSettled={onSettled}
          />
        ) : null}

        <ExchangeSheet
          wallets={wallets}
          isKycVerified={isKycVerified}
          defaultFromAccountId={exchangeFromId}
          open={exchangeOpen}
          onOpenChange={setExchangeOpen}
          onSettled={onSettled}
        />
      </main>
    </DashboardLayout>
  );
}
