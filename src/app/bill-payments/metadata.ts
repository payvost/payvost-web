import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bill Payments | Pay Bills Across Multiple Countries - Payvost',
  description: 'Pay bills across multiple countries from one place, no switching. Manage utility bills, subscriptions, and services from a single platform with auto-pay options.',
  keywords: [
    'bill payments',
    'utility bills',
    'pay bills online',
    'international bill payment',
    'auto-pay',
    'subscription payments',
    'multi-country bills',
    'bill management',
    'recurring payments',
    'online bill pay',
  ],
  openGraph: {
    title: 'Bill Payments | Pay Bills Across Multiple Countries',
    description: 'Pay bills across multiple countries from one place, no switching. Manage all your bills in one convenient platform.',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Payvost Bill Payments',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bill Payments | Pay Bills Across Multiple Countries',
    description: 'Pay bills across multiple countries from one place, no switching.',
  },
  alternates: {
    canonical: '/bill-payments',
  },
};

