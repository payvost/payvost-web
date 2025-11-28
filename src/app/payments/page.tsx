import type { Metadata } from 'next';
import { PaymentsPageClient } from './payments-client';

export const metadata: Metadata = {
  title: 'Global Payments | Send Money Worldwide',
  description: 'Send and receive money to over 150 countries with competitive exchange rates. Fast, secure international payments with real-time tracking. Support for cards, bank transfers, mobile money, and digital wallets.',
  keywords: [
    'international payments',
    'send money abroad',
    'global money transfer',
    'cross-border payments',
    'international remittance',
    'wire transfer',
    'online payments',
    'money transfer service',
    'foreign exchange payments',
    'instant money transfer',
  ],
  openGraph: {
    title: 'Global Payments | Send Money Worldwide',
    description: 'Send and receive money internationally with competitive rates. Fast, secure payments to 150+ countries.',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Payvost Global Payments',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Global Payments | Send Money Worldwide',
    description: 'Send and receive money internationally with competitive rates and real-time tracking.',
  },
  alternates: {
    canonical: '/payments',
  },
};

export default function PaymentsPage() {
  return <PaymentsPageClient />;
}

