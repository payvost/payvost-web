import type { Metadata } from 'next';
import { AccountsPageClient } from './accounts-client';

export const metadata: Metadata = {
  title: 'Multi-Currency Accounts | Global Banking - Payvost',
  description: 'Open accounts in multiple currencies, manage your global finances, and send money worldwide. Personal and business accounts with multi-currency support, instant transfers, and bank-level security.',
  keywords: [
    'multi-currency account',
    'global bank account',
    'international account',
    'foreign currency account',
    'business account',
    'personal account',
    'multi-currency wallet',
    'global banking',
    'currency account',
    'international banking',
  ],
  openGraph: {
    title: 'Multi-Currency Accounts | Global Banking',
    description: 'Open accounts in multiple currencies and manage your global finances from one platform.',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Payvost Multi-Currency Accounts',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Multi-Currency Accounts | Global Banking',
    description: 'Open accounts in multiple currencies and manage your global finances.',
  },
  alternates: {
    canonical: '/accounts',
  },
};

export default function AccountsPage() {
  return <AccountsPageClient />;
}

