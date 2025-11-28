import type { Metadata } from 'next';
import { PayoutsPageClient } from './payouts-client';

export const metadata: Metadata = {
  title: 'International Payouts | Fast Global Money Transfers',
  description: 'Send money to bank accounts, mobile wallets, and cash pickup locations worldwide. Automated payroll, vendor payments, and marketplace payouts. Built for businesses that need reliable, scalable payout infrastructure.',
  keywords: [
    'international payouts',
    'global payouts',
    'payroll payments',
    'vendor payments',
    'marketplace payouts',
    'automated payouts',
    'scheduled transfers',
    'bulk payments',
    'cross-border payouts',
    'business payouts',
  ],
  openGraph: {
    title: 'International Payouts | Fast Global Money Transfers',
    description: 'Send money to bank accounts, mobile wallets, and cash pickup locations worldwide. Built for businesses.',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Payvost International Payouts',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'International Payouts | Fast Global Money Transfers',
    description: 'Send money to bank accounts, mobile wallets, and cash pickup locations worldwide.',
  },
  alternates: {
    canonical: '/payouts',
  },
};

export default function PayoutsPage() {
  return <PayoutsPageClient />;
}

