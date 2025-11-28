import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Multi-Currency Wallets | Manage FX Assets - Payvost',
  description: 'Create up to 15+ wallets by currencies and manage your fx assets in one place. Multi-currency support with instant transfers and real-time tracking.',
  keywords: [
    'multi-currency wallet',
    'fx assets',
    'currency wallet',
    'digital wallet',
    'foreign exchange',
    'wallet management',
    'multi-currency account',
    'fx management',
    'currency exchange',
    'digital assets',
  ],
  openGraph: {
    title: 'Multi-Currency Wallets | Manage FX Assets',
    description: 'Create up to 15+ wallets by currencies and manage your fx assets in one place.',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Payvost Wallets',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Multi-Currency Wallets | Manage FX Assets',
    description: 'Create up to 15+ wallets by currencies and manage your fx assets in one place.',
  },
  alternates: {
    canonical: '/wallet',
  },
};

