'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { SUPPORTED_COUNTRIES } from '@/config/kyc-config';
import { walletService, type Account } from '@/services';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import Link from 'next/link';

export default function WalletSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { userData, loading: loadingUser } = useUserPreferences();

  const [wallets, setWallets] = useState<Account[]>([]);
  const [loadingWallets, setLoadingWallets] = useState(true);
  const [savingDefaultWallet, setSavingDefaultWallet] = useState(false);

  const inferredHomeCurrency = useMemo(() => {
    if (typeof userData?.homeCurrency === 'string' && userData.homeCurrency) return userData.homeCurrency;
    if (typeof userData?.country === 'string' && userData.country) {
      return SUPPORTED_COUNTRIES.find((c) => c.iso2 === userData.country)?.currency ?? null;
    }
    return null;
  }, [userData?.homeCurrency, userData?.country]);

  const defaultWalletCurrency =
    typeof userData?.defaultWalletCurrency === 'string' && userData.defaultWalletCurrency
      ? userData.defaultWalletCurrency
      : inferredHomeCurrency;

  useEffect(() => {
    let cancelled = false;

    const loadWallets = async () => {
      if (!user) {
        setLoadingWallets(false);
        return;
      }
      try {
        setLoadingWallets(true);
        const accounts = await walletService.getAccounts();
        const normalized = accounts.map((a) => ({
          ...a,
          balance: typeof a.balance === "string" ? parseFloat(a.balance) : a.balance,
        }));
        if (!cancelled) setWallets(normalized);
      } catch (error) {
        console.error('Failed to load wallets:', error);
        if (!cancelled) setWallets([]);
      } finally {
        if (!cancelled) setLoadingWallets(false);
      }
    };

    void loadWallets();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleDefaultWalletChange = async (currency: string) => {
    if (!user) return;

    const exists = wallets.some((w) => w.currency === currency);
    if (!exists) {
      toast({
        title: 'Wallet not found',
        description: 'Create the wallet first, then set it as default.',
        variant: 'destructive',
      });
      return;
    }

    setSavingDefaultWallet(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { defaultWalletCurrency: currency });
      toast({
        title: 'Default wallet updated',
        description: `${currency} is now your default wallet.`,
      });
    } catch (error) {
      console.error('Failed to update default wallet currency:', error);
      toast({
        title: 'Update failed',
        description: 'Could not update your default wallet. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingDefaultWallet(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Wallet</h2>
        <p className="text-sm text-muted-foreground">Choose which wallet the dashboard uses by default.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Wallet Preferences</CardTitle>
          <CardDescription>These settings affect how balances and shortcuts are shown across the app.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-muted-foreground">Home Currency</Label>
            {loadingUser ? (
              <Skeleton className="h-12 w-full" />
            ) : (
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Your home currency wallet</p>
                  <p className="text-xs text-muted-foreground">
                    {inferredHomeCurrency ? `${inferredHomeCurrency} is your sign-up currency.` : 'We will use your sign-up country currency as home.'}
                  </p>
                </div>
                <Badge variant="secondary">{inferredHomeCurrency || 'Auto'}</Badge>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="default-wallet">Default Wallet</Label>
            <Select
              value={defaultWalletCurrency || ''}
              onValueChange={handleDefaultWalletChange}
              disabled={loadingWallets || savingDefaultWallet || wallets.length === 0}
            >
              <SelectTrigger id="default-wallet">
                <SelectValue placeholder={loadingWallets ? 'Loading wallets...' : 'Select a wallet currency'} />
              </SelectTrigger>
              <SelectContent>
                {wallets
                  .slice()
                  .sort((a, b) => a.currency.localeCompare(b.currency))
                  .map((w) => (
                    <SelectItem key={w.currency} value={w.currency}>
                      {w.currency}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              This controls which wallet is treated as your primary wallet on the dashboard.
            </p>
          </div>

          <div className="flex items-center justify-end">
            <Button variant="outline" asChild>
              <Link href="/dashboard/wallets">Manage wallets</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
