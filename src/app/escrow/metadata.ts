import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Secure Escrow Services | Protected Payments - Payvost',
  description: 'Protect your transactions with secure escrow services. Funds held securely until conditions are met. Perfect for marketplace transactions, service agreements, and milestone payments.',
  keywords: [
    'escrow',
    'escrow service',
    'secure payment',
    'protected payment',
    'escrow account',
    'transaction protection',
    'milestone payment',
    'marketplace escrow',
    'secure transaction',
    'payment escrow',
  ],
  openGraph: {
    title: 'Secure Escrow Services | Protected Payments',
    description: 'Protect your transactions with secure escrow services. Funds held securely until conditions are met.',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Payvost Escrow Services',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Secure Escrow Services | Protected Payments',
    description: 'Protect your transactions with secure escrow services.',
  },
  alternates: {
    canonical: '/escrow',
  },
};

