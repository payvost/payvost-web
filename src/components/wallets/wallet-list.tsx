'use client';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [sort, setSort] = useState<'balance_desc' | 'currency_asc'>('balance_desc');

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    const subset = !q ? wallets : wallets.filter(w => w.currency.toUpperCase().includes(q));

    const sorted = [...subset];
    if (sort === 'balance_desc') {
      sorted.sort((a, b) => (b.balance || 0) - (a.balance || 0));
    } else if (sort === 'currency_asc') {
      sorted.sort((a, b) => a.currency.localeCompare(b.currency));
    }
    return sorted;
  }, [wallets, query, sort]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          {wallets.length} active {wallets.length === 1 ? 'wallet' : 'wallets'}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select value={sort} onValueChange={(v) => setSort(v as any)}>
            <SelectTrigger className="sm:w-44" aria-label="Sort wallets">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="balance_desc">Balance (high)</SelectItem>
              <SelectItem value="currency_asc">Currency (A-Z)</SelectItem>
            </SelectContent>
          </Select>

          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search currency (e.g. USD)"
            className="sm:max-w-xs"
          />
        </div>
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
