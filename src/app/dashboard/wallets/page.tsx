
'use client';

import { useState } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { WalletCard } from '@/components/wallet-card';

// Placeholder data - in a real app, this would come from an API
const wallets = [
  { currency: 'USD', name: 'US Dollar', balance: '1,250.75', flag: 'us' },
  { currency: 'EUR', name: 'Euro', balance: '2,500.50', flag: 'eu' },
  { currency: 'GBP', name: 'British Pound', balance: '850.00', flag: 'gb' },
  { currency: 'NGN', name: 'Nigerian Naira', balance: '1,850,000.00', flag: 'ng' },
  { currency: 'JPY', name: 'Japanese Yen', balance: '150,000', flag: 'jp' },
  { currency: 'CAD', name: 'Canadian Dollar', balance: '1,500.00', flag: 'ca' },
  { currency: 'AUD', name: 'Australian Dollar', balance: '950.00', flag: 'au' },
  { currency: 'GHS', name: 'Ghanaian Cedi', balance: '12,500.00', flag: 'gh' },
];

export default function WalletsPage() {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');

  return (
    <DashboardLayout language={language} setLanguage={setLanguage}>
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold md:text-2xl">My Wallets</h1>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Wallet
          </Button>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {wallets.map(wallet => (
            <WalletCard key={wallet.currency} {...wallet} />
          ))}
        </div>
      </main>
    </DashboardLayout>
  );
}
