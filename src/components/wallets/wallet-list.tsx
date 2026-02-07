'use client';

import { Input } from '@/components/ui/input';
import type { Account } from '@/services';
import { useMemo, useState } from 'react';
import { WalletCard } from './wallet-card';

export function WalletList(props: {
  wallets: Account[];
  primaryCurrency?: string | null;
  onFund: (wallet: Account) => void;
  onExchangeFrom: (wallet: Account) => void;
  onDetails: (wallet: Account) => void;
}) {
  const { wallets, primaryCurrency, onFund, onExchangeFrom, onDetails } = props;
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return wallets;
    return wallets.filter(w => w.currency.toUpperCase().includes(q));
  }, [wallets, query]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          {wallets.length} active {wallets.length === 1 ? 'wallet' : 'wallets'}
        </div>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search currency (e.g. USD)"
          className="sm:max-w-xs"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map(wallet => (
          <WalletCard
            key={wallet.id}
            wallet={wallet}
            isPrimary={!!primaryCurrency && wallet.currency === primaryCurrency}
            onFund={onFund}
            onExchangeFrom={onExchangeFrom}
            onDetails={onDetails}
          />
        ))}
      </div>
    </div>
  );
}

